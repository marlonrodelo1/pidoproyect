import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, registro } = useAuth()
  const [modo, setModo] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      if (modo === 'login') {
        await login(email, password)
      } else {
        await registro(email, password, nombre, telefono)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: '1px solid var(--c-border)', fontSize: 14, fontFamily: 'inherit',
    marginBottom: 10, background: 'var(--c-surface)', color: 'var(--c-text)', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--c-primary)', marginBottom: 8, letterSpacing: -2 }}>pidoo</div>
      <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 32, textAlign: 'center' }}>Tu comida favorita, al alcance de un toque</p>
      <div style={{ width: '100%', maxWidth: 340 }}>
        <div style={{ display: 'flex', background: 'var(--c-surface2)', borderRadius: 12, padding: 3, marginBottom: 20 }}>
          {['login', 'registro'].map(m => (
            <button key={m} onClick={() => { setModo(m); setError(null) }} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: modo === m ? 'var(--c-primary)' : 'transparent',
              color: modo === m ? '#fff' : 'var(--c-muted)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>
        {modo === 'registro' && (
          <input placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} />
        )}
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
        {modo === 'registro' && (
          <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={inputStyle} />
        )}
        {error && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
          background: loading ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff',
          fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', marginTop: 6,
        }}>
          {loading ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--c-muted)' }}>
          {modo === 'login' ? '¿Olvidaste tu contraseña?' : 'Al registrarte aceptas nuestros términos'}
        </div>
      </div>
    </div>
  )
}
