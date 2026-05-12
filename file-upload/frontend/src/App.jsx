import { useState } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState([])
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (response.ok) {
        setImages(data.images)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container">
      <h1>Image Resizer & MinIO Storage</h1>
      
      <form onSubmit={handleUpload} className="upload-section">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit" disabled={uploading || !file}>
          {uploading ? 'Processing...' : 'Upload & Resize'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {images.length > 0 && (
        <div className="results">
          {images.map((img, idx) => (
            <div key={idx} className="image-card">
              <h3>{img.size.toUpperCase()}</h3>
              <img src={img.url} alt={img.size} />
              <p>URL: {img.url}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
