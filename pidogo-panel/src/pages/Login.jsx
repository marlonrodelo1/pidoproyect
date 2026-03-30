import { useState } from 'react'
import { useSocio } from '../context/SocioContext'
import { supabase } from '../lib/supabase'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
)

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
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={input} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} style={input} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10, textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
          background: loading ? 'var(--c-muted)' : 'var(--c-accent)', color: '#fff',
          fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
        }}>{loading ? 'Entrando...' : 'Entrar'}</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
          <span style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>o</span>
          <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
        </div>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })} style={{
          width: '100%', padding: '14px 0', borderRadius: 14, border: '1px solid var(--c-border)',
          background: 'var(--c-surface)', color: 'var(--c-text)',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <GoogleIcon /> Continuar con Google
        </button>
      </div>
    </div>
  )
}
