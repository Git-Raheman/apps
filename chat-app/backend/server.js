const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({ url: REDIS_URL });

redisClient.on('error', (err) => console.log('Redis Client Error', err));

async function startServer() {
  await redisClient.connect();
  console.log('Connected to Redis');

  io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    // Fetch last 50 messages from Redis
    try {
      const messages = await redisClient.lRange('chat_messages', 0, 49);
      // Messages are stored as strings, parse them
      const parsedMessages = messages.map(m => JSON.parse(m)).reverse();
      socket.emit('message_history', parsedMessages);
    } catch (err) {
      console.error('Error fetching history:', err);
    }

    socket.on('chat_message', async (data) => {
      const messageData = {
        username: data.username,
        text: data.text,
        timestamp: new Date().toISOString()
      };

      // Broadcast to all clients
      io.emit('chat_message', messageData);

      // Save to Redis (keeping last 50)
      try {
        await redisClient.lPush('chat_messages', JSON.stringify(messageData));
        await redisClient.lTrim('chat_messages', 0, 49);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
