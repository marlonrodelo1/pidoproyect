import { useState } from 'react'
import { useRest } from '../context/RestContext'
import { supabase } from '../lib/supabase'
import { Capacitor } from '@capacitor/core'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
)

const TIPOS = [
  { id: 'restaurante', l: '🍽️ Restaurante' }, { id: 'cafeteria', l: '☕ Cafetería' },
  { id: 'pizzeria', l: '🍕 Pizzería' }, { id: 'hamburgueseria', l: '🍔 Hamburguesería' },
  { id: 'sushi', l: '🍣 Sushi' }, { id: 'panaderia', l: '🥐 Panadería' },
  { id: 'minimarket', l: '🛒 Minimarket' }, { id: 'farmacia', l: '💊 Farmacia' },
  { id: 'otro', l: '🏪 Otro' },
]

export default function Login() {
  const { login, registro } = useRest()
  const [modo, setModo] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Registro
  const [form, setForm] = useState({
    nombre: '', tipo: 'restaurante', categoria_padre: 'comida',
    email: '', password: '', telefono: '', direccion: '', descripcion: '',
  })

  function traducirError(msg) {
    if (!msg) return 'Error desconocido'
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos'
    if (msg.includes('Email not confirmed')) return 'Debes confirmar tu email antes de iniciar sesión'
    if (msg.includes('User already registered')) return 'Este email ya está registrado. Intenta iniciar sesión.'
    if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres'
    if (msg.includes('Unable to validate email')) return 'El formato del email no es válido'
    if (msg.includes('Email rate limit exceeded')) return 'Demasiados intentos. Espera unos minutos.'
    if (msg.includes('For security purposes')) return 'Demasiados intentos. Espera unos segundos.'
    if (msg.includes('Network')) return 'Error de conexión. Verifica tu internet.'
    return msg
  }

  const handleLogin = async () => {
    setError(null); setLoading(true)
    try { await login(email, password) }
    catch (err) { setError(traducirError(err.message)) }
    finally { setLoading(false) }
  }

  const handleRegistro = async () => {
    setError(null)
    if (!form.nombre.trim()) { setError('El nombre del negocio es obligatorio'); return }
    if (!form.email.trim()) { setError('El email es obligatorio'); return }
    if (!form.password || form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (!aceptaTerminos) { setError('Debes aceptar los términos y condiciones'); return }
    setLoading(true)
    try { await registro(form) }
    catch (err) { setError(traducirError(err.message)) }
    finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--c-border)', fontSize: 14, fontFamily: 'inherit', marginBottom: 10, background: 'var(--c-surface)', color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box' }
  const sel = { ...inp, appearance: 'none', WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>')}")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36 }
  const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', marginBottom: 4, display: 'block' }

  return (
    <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>Panel Restaurante</div>
      <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 24 }}>{modo === 'login' ? 'Gestiona tus pedidos y carta' : 'Registra tu negocio en PIDOO'}</p>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--c-surface2)', borderRadius: 12, padding: 3, marginBottom: 20 }}>
          {['login', 'registro'].map(m => (
            <button key={m} onClick={() => { setModo(m); setError(null) }} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: modo === m ? 'var(--c-primary)' : 'transparent',
              color: modo === m ? '#fff' : 'var(--c-muted)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>{m === 'login' ? 'Iniciar sesión' : 'Registrarse'}</button>
          ))}
        </div>

        {modo === 'login' ? (
          <>
            <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} style={inp} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            {error && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 10, textAlign: 'center', background: 'rgba(220,38,38,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
            <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: loading ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Nombre del negocio *</label><input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: La Pizzeria del Puerto" style={inp} /></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}><label style={lbl}>Tipo</label><select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={sel}>{TIPOS.map(t => <option key={t.id} value={t.id}>{t.l}</option>)}</select></div>
              <div style={{ flex: 1 }}><label style={lbl}>Categoría</label><select value={form.categoria_padre} onChange={e => setForm({ ...form, categoria_padre: e.target.value })} style={sel}>
                <option value="comida">🍕 Comida</option><option value="farmacia">💊 Farmacia</option><option value="marketplace">🛒 Marketplace</option>
              </select></div>
            </div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="tu@email.com" style={inp} /></div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Contraseña *</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" style={inp} /></div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Teléfono</label><input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+34 600 000 000" style={inp} /></div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Dirección</label><input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección del negocio" style={inp} /></div>

            {/* Términos */}
            <button onClick={() => setAceptaTerminos(!aceptaTerminos)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0, marginBottom: 14 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, border: aceptaTerminos ? 'none' : '2px solid rgba(255,255,255,0.2)', background: aceptaTerminos ? 'var(--c-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff' }}>{aceptaTerminos && '✓'}</div>
              <span style={{ fontSize: 11, color: 'var(--c-muted)', lineHeight: 1.4 }}>
                Acepto los <a href="https://pidoo.es/terminos-restaurantes" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-primary)', fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>términos y condiciones</a> y la <a href="https://pidoo.es/privacidad-restaurantes" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-primary)', fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>política de privacidad</a>
              </span>
            </button>

            {error && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 10, textAlign: 'center', background: 'rgba(220,38,38,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
            <button onClick={handleRegistro} disabled={loading} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: loading ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Creando...' : 'Registrar negocio'}
            </button>
          </>
        )}

        {/* Google */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
          <span style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>o</span>
          <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
        </div>
        <button onClick={() => {
          const redirectTo = Capacitor.isNativePlatform() ? 'com.pido.restaurante://login' : window.location.origin
          supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
        }} style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <GoogleIcon /> Continuar con Google
        </button>
      </div>
    </div>
  )
}
