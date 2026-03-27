import { useState } from 'react'
import { useSocio } from '../context/SocioContext'

export default function Login() {
  const { login } = useSocio()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null); setLoading(true)
    try { await login(email, password) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const input = { width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--c-border)', fontSize: 14, fontFamily: 'inherit', marginBottom: 10, background: 'var(--c-surface)', color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-accent)', marginBottom: 4, letterSpacing: 1 }}>PIDOGO</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--c-text)', marginBottom: 8 }}>Panel del Socio</div>
      <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 32 }}>Gestiona tus pedidos y negocios</p>
      <div style={{ width: '100%', maxWidth: 340 }}>
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={input} />
        <input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} style={input} />
        {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
          background: loading ? 'var(--c-muted)' : 'var(--c-accent)', color: '#fff',
          fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
        }}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </div>
    </div>
  )
}
