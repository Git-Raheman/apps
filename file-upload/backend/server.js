const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const Minio = require('minio');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

// MinIO Client Configuration
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ROOT_USER,
  secretKey: process.env.MINIO_ROOT_PASSWORD
});

const bucketName = process.env.MINIO_BUCKET || 'uploads';

// Initialize Bucket
const initBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket ${bucketName} created.`);
      
      // Set public policy for viewing images
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetBucketLocation", "s3:ListBucket"],
            Resource: [`arn:aws:s3:::${bucketName}`]
          },
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`]
          }
        ]
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    }
  } catch (err) {
    console.error('Error initializing MinIO bucket:', err);
  }
};

initBucket();

// Multer Configuration (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filename = `${Date.now()}-${req.file.originalname}`;
  const sizes = [
    { name: 'thumb', width: 150 },
    { name: 'medium', width: 600 },
    { name: 'large', width: 1200 }
  ];

  try {
    const results = await Promise.all(sizes.map(async (size) => {
      const resizedBuffer = await sharp(req.file.buffer)
        .resize(size.width)
        .toBuffer();

      const objectName = `${size.name}-${filename}`;
      await minioClient.putObject(bucketName, objectName, resizedBuffer);

      // Construct public URL
      // Note: In a real docker environment, the client (browser) uses 'localhost:9000' or the proxy
      // For this prototype, we'll return a path that the proxy can handle if we were proxying MinIO
      // But here, we'll assume the browser can reach MinIO at http://localhost:9000/uploads/...
      return {
        size: size.name,
        url: `http://localhost:9000/${bucketName}/${objectName}`
      };
    }));

    res.json({ message: 'Upload and resizing successful', images: results });
  } catch (err) {
    console.error('Error processing image:', err);
    res.status(500).json({ message: 'Error processing image' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
