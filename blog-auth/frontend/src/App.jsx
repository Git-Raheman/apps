import { useState, useEffect } from 'react'

function App() {
  const [view, setView] = useState('list') // list, login, register
  const [posts, setPosts] = useState([])
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      const data = await response.json()
      setPosts(data)
    } catch (err) {
      console.error('Error fetching posts:', err)
    }
  }

  const handleAuth = async (e, type) => {
    e.preventDefault()
    setError('')
    try {
      const response = await fetch(`/api/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()
      if (response.ok) {
        if (type === 'login') {
          localStorage.setItem('token', data.token)
          setToken(data.token)
          setView('list')
        } else {
          setView('login')
        }
        setEmail('')
        setPassword('')
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('An error occurred')
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      })
      if (response.ok) {
        setTitle('')
        setContent('')
        fetchPosts()
      }
    } catch (err) {
      console.error('Error creating post:', err)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <div className="container">
      <header>
        <h1>My Blog</h1>
        <nav>
          <button onClick={() => setView('list')}>Home</button>
          {token ? (
            <button onClick={logout}>Logout</button>
          ) : (
            <>
              <button onClick={() => setView('login')}>Login</button>
              <button onClick={() => setView('register')}>Register</button>
            </>
          )}
        </nav>
      </header>

      {error && <p className="error">{error}</p>}

      {view === 'login' && (
        <form onSubmit={(e) => handleAuth(e, 'login')} className="auth-form">
          <h2>Login</h2>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
      )}

      {view === 'register' && (
        <form onSubmit={(e) => handleAuth(e, 'register')} className="auth-form">
          <h2>Register</h2>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Register</button>
        </form>
      )}

      {view === 'list' && (
        <main>
          {token && (
            <form onSubmit={handleCreatePost} className="post-form">
              <h3>Create a Post</h3>
              <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
              <textarea placeholder="Content" value={content} onChange={e => setContent(e.target.value)} required />
              <button type="submit">Publish</button>
            </form>
          )}
          <div className="posts">
            {posts.map(post => (
              <article key={post.id} className="post">
                <h2>{post.title}</h2>
                <p>{post.content}</p>
                <small>By {post.author} on {new Date(post.created_at).toLocaleDateString()}</small>
              </article>
            ))}
          </div>
        </main>
      )}
    </div>
  )
}

export default App
