import { useState } from 'react'
import { useSocio } from '../context/SocioContext'
import { supabase } from '../lib/supabase'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
)

export default function Login() {
  const { login, registro, registroComoSocio, user, logout } = useSocio()
  const [modo, setModo] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [form, setForm] = useState({
    nombre: '', nombre_comercial: '', email: '', password: '', telefono: '',
  })

  // Usuario autenticado pero sin perfil de socio (ej: cliente de pido-app)
  const needsRiderProfile = !!user

  const [riderForm, setRiderForm] = useState({
    nombre: user?.user_metadata?.full_name || user?.user_metadata?.nombre || '',
    nombre_comercial: '',
    telefono: '',
  })

  const handleRegistroRider = async () => {
    setError(null)
    if (!riderForm.nombre.trim()) { setError('Tu nombre es obligatorio'); return }
    if (!riderForm.nombre_comercial.trim()) { setError('El nombre comercial es obligatorio'); return }
    if (!aceptaTerminos) { setError('Debes aceptar los términos y condiciones'); return }
    setLoading(true)
    try {
      await registroComoSocio(riderForm)
      // registroComoSocio hace setSocio() → App.jsx detecta socio y muestra el panel
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleLogin = async () => {
    setError(null); setLoading(true)
    try { await login(email, password) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleRegistro = async () => {
    setError(null)
    if (!form.nombre.trim()) { setError('Tu nombre es obligatorio'); return }
    if (!form.nombre_comercial.trim()) { setError('El nombre comercial es obligatorio'); return }
    if (!form.email.trim()) { setError('El email es obligatorio'); return }
    if (!form.password || form.password.length < 6) { setError('Contraseña mínimo 6 caracteres'); return }
    if (!aceptaTerminos) { setError('Debes aceptar los términos y condiciones'); return }
    setLoading(true)
    try {
      await registro(form)
      setSuccess(true)
    }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--c-border)', fontSize: 14, fontFamily: 'inherit', marginBottom: 10, background: 'var(--c-surface)', color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', marginBottom: 4, display: 'block' }

  // Vista: usuario autenticado pero sin perfil de socio → completar registro
  if (needsRiderProfile) {
    return (
      <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-accent)', marginBottom: 4, letterSpacing: 1 }}>PIDOGO</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>Completa tu registro</div>
        <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 6, textAlign: 'center' }}>
          ¡Hola, {user.user_metadata?.full_name || user.user_metadata?.nombre || user.email}!
        </p>
        <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 24, textAlign: 'center', maxWidth: 320 }}>
          Para empezar a repartir necesitamos algunos datos adicionales.
        </p>

        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Tu nombre completo *</label><input value={riderForm.nombre} onChange={e => setRiderForm({ ...riderForm, nombre: e.target.value })} placeholder="Ej: Carlos Martínez" style={inp} /></div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Nombre comercial * (será tu URL)</label><input value={riderForm.nombre_comercial} onChange={e => setRiderForm({ ...riderForm, nombre_comercial: e.target.value })} placeholder="Ej: Carlos Delivery" style={inp} /></div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Teléfono</label><input type="tel" value={riderForm.telefono} onChange={e => setRiderForm({ ...riderForm, telefono: e.target.value })} placeholder="+34 600 000 000" style={inp} /></div>

          {riderForm.nombre_comercial && (
            <div style={{ fontSize: 11, color: 'var(--c-accent)', fontWeight: 600, marginBottom: 12 }}>
              Tu tienda: pidoo.es/{riderForm.nombre_comercial.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
            </div>
          )}

          <div style={{ background: 'var(--c-surface)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, border: '1px solid var(--c-border)' }}>
            <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>Conectado como</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginTop: 2 }}>{user.email}</div>
          </div>

          <button onClick={() => setAceptaTerminos(!aceptaTerminos)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0, marginBottom: 14 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, border: aceptaTerminos ? 'none' : '2px solid rgba(255,255,255,0.2)', background: aceptaTerminos ? 'var(--c-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff' }}>{aceptaTerminos && '✓'}</div>
            <span style={{ fontSize: 11, color: 'var(--c-muted)', lineHeight: 1.4 }}>
              Acepto los <a href="https://pidoo.es/terminos-socios" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-accent)', fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>términos y condiciones</a> y la <a href="https://pidoo.es/privacidad-socios" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-accent)', fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>política de privacidad</a>
            </span>
          </button>

          {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10, textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

          <button onClick={handleRegistroRider} disabled={loading} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: loading ? 'var(--c-muted)' : 'var(--c-accent)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Enviando...' : 'Solicitar ser repartidor'}
          </button>
          <div style={{ fontSize: 10, color: 'var(--c-muted)', textAlign: 'center', marginTop: 8 }}>Tu cuenta será revisada y aprobada por el equipo PIDOO</div>

          <button onClick={logout} style={{ width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 12, border: '1px solid var(--c-border)', background: 'transparent', color: 'var(--c-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)', marginBottom: 8 }}>¡Solicitud enviada!</div>
        <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 24, maxWidth: 300, lineHeight: 1.5 }}>
          Tu cuenta de socio está pendiente de aprobación. Te notificaremos cuando esté activa.
        </p>
        <button onClick={() => { setSuccess(false); setModo('login') }} style={{ padding: '14px 32px', borderRadius: 14, border: 'none', background: 'var(--c-accent)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Ir al login</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-accent)', marginBottom: 4, letterSpacing: 1 }}>PIDOGO</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>Panel del Socio</div>
      <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 24 }}>{modo === 'login' ? 'Gestiona tus pedidos y negocios' : 'Únete como socio repartidor'}</p>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--c-surface2)', borderRadius: 12, padding: 3, marginBottom: 20 }}>
          {['login', 'registro'].map(m => (
            <button key={m} onClick={() => { setModo(m); setError(null) }} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: modo === m ? 'var(--c-accent)' : 'transparent',
              color: modo === m ? '#fff' : 'var(--c-muted)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>{m === 'login' ? 'Iniciar sesión' : 'Registrarse'}</button>
          ))}
        </div>

        {modo === 'login' ? (
          <>
            <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} style={inp} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10, textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
            <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: loading ? 'var(--c-muted)' : 'var(--c-accent)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Tu nombre completo *</label><input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Carlos Martínez" style={inp} /></div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Nombre comercial * (será tu URL)</label><input value={form.nombre_comercial} onChange={e => setForm({ ...form, nombre_comercial: e.target.value })} placeholder="Ej: Carlos Delivery" style={inp} /></div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="tu@email.com" style={inp} /></div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Contraseña *</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" style={inp} /></div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Teléfono</label><input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+34 600 000 000" style={inp} /></div>

            {form.nombre_comercial && (
              <div style={{ fontSize: 11, color: 'var(--c-accent)', fontWeight: 600, marginBottom: 12 }}>
                Tu tienda: pidoo.es/{form.nombre_comercial.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
              </div>
            )}

            {/* Términos */}
            <button onClick={() => setAceptaTerminos(!aceptaTerminos)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0, marginBottom: 14 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, border: aceptaTerminos ? 'none' : '2px solid rgba(255,255,255,0.2)', background: aceptaTerminos ? 'var(--c-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff' }}>{aceptaTerminos && '✓'}</div>
              <span style={{ fontSize: 11, color: 'var(--c-muted)', lineHeight: 1.4 }}>
                Acepto los <a href="https://pidoo.es/terminos-socios" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-accent)', fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>términos y condiciones</a> y la <a href="https://pidoo.es/privacidad-socios" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-accent)', fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>política de privacidad</a>
              </span>
            </button>

            {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10, textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
            <button onClick={handleRegistro} disabled={loading} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: loading ? 'var(--c-muted)' : 'var(--c-accent)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Enviando...' : 'Solicitar ser socio'}
            </button>
            <div style={{ fontSize: 10, color: 'var(--c-muted)', textAlign: 'center', marginTop: 8 }}>Tu cuenta será revisada y aprobada por el equipo PIDOO</div>
          </>
        )}

        {/* Google */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
          <span style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>o</span>
          <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
        </div>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })} style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <GoogleIcon /> Continuar con Google
        </button>
      </div>
    </div>
  )
}
