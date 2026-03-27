import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'

export default function Login() {
  const { login } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await login(email, password)
    if (error) setError('Credenciales incorrectas')
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ fontWeight: 800, fontSize: 28, color: '#FF6B2C', letterSpacing: -1, marginBottom: 4 }}>pidoo</div>
        <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32, fontWeight: 500 }}>Super Admin Panel</div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          <input
            type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            style={styles.input} required
          />
          <input
            type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            style={styles.input} required
          />
          {error && <div style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>{error}</div>}
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#F3F4F6', fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '48px 40px', width: 380,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #E5E7EB',
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  },
  btn: {
    padding: '12px', borderRadius: 10, border: 'none', background: '#FF6B2C', color: '#fff',
    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    marginTop: 8,
  },
}
