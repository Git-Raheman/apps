import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

function App() {
  const [username, setUsername] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const socketRef = useRef()

  useEffect(() => {
    socketRef.current = io('/', { path: '/socket.io/' })

    socketRef.current.on('message_history', (history) => {
      setMessages(history)
    })

    socketRef.current.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    if (username.trim()) {
      setIsLoggedIn(true)
    }
  }

  const sendMessage = (e) => {
    e.preventDefault()
    if (message.trim()) {
      socketRef.current.emit('chat_message', { username, text: message })
      setMessage('')
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <h1>Join Chat</h1>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit">Join</button>
        </form>
      </div>
    )
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Global Chat</h1>
        <span>User: {username}</span>
      </div>
      <div className="message-list">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.username === username ? 'own' : ''}`}>
            <strong>{msg.username}: </strong>
            <span>{msg.text}</span>
            <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}

export default App
