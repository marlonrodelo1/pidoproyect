import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login, registro, resetPassword } = useAuth()
  const [modo, setModo] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetEnviado, setResetEnviado] = useState(false)
  const [errores, setErrores] = useState({})

  function validar() {
    const e = {}
    if (!email.trim()) e.email = 'El email es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email no válido'

    if (modo !== 'reset') {
      if (!password) e.password = 'La contraseña es obligatoria'
      else if (password.length < 6) e.password = 'Mínimo 6 caracteres'
    }

    if (modo === 'registro') {
      if (!nombre.trim()) e.nombre = 'El nombre es obligatorio'
      if (telefono && !/^\+?\d{7,15}$/.test(telefono.replace(/\s/g, ''))) e.telefono = 'Teléfono no válido'
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validar()) return
    setError(null)
    setLoading(true)
    try {
      if (modo === 'reset') {
        await resetPassword(email)
        setResetEnviado(true)
      } else if (modo === 'login') {
        await login(email, password)
      } else {
        await registro(email, password, nombre.trim(), telefono.replace(/\s/g, ''))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const inputWrap = { position: 'relative', marginBottom: 12 }
  const iconStyle = { position: 'absolute', left: 14, top: 14, color: 'var(--c-muted)' }
  const inputStyle = {
    width: '100%', padding: '14px 16px 14px 44px', borderRadius: 12,
    border: '1px solid var(--c-border)', fontSize: 14, fontFamily: 'inherit',
    background: 'var(--c-surface)', color: 'var(--c-text)', outline: 'none',
    boxSizing: 'border-box', transition: 'border 0.2s',
  }
  const inputError = { ...inputStyle, borderColor: '#EF4444' }
  const errorTextStyle = { color: '#EF4444', fontSize: 11, marginTop: 2, marginLeft: 4 }

  if (modo === 'reset' && resetEnviado) {
    return (
      <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📩</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text)', marginBottom: 8, textAlign: 'center' }}>
          Revisa tu email
        </div>
        <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 28, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
          Enviamos un enlace a <strong style={{ color: 'var(--c-text)' }}>{email}</strong> para restablecer tu contraseña
        </p>
        <button onClick={() => { setModo('login'); setResetEnviado(false); setError(null); setErrores({}) }} style={{
          padding: '14px 32px', borderRadius: 12, border: 'none',
          background: 'var(--c-primary)', color: '#fff',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Volver al inicio de sesión
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--c-primary)', marginBottom: 8, letterSpacing: -2 }}>pidoo</div>
      <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 32, textAlign: 'center' }}>
        {modo === 'reset' ? 'Introduce tu email para recuperar tu contraseña' : 'Tu comida favorita, al alcance de un toque'}
      </p>

      <div style={{ width: '100%', maxWidth: 340 }}>
        {modo !== 'reset' ? (
          <div style={{ display: 'flex', background: 'var(--c-surface2)', borderRadius: 12, padding: 3, marginBottom: 20 }}>
            {['login', 'registro'].map(m => (
              <button key={m} onClick={() => { setModo(m); setError(null); setErrores({}) }} style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                background: modo === m ? 'var(--c-primary)' : 'transparent',
                color: modo === m ? '#fff' : 'var(--c-muted)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>
        ) : (
          <button onClick={() => { setModo('login'); setError(null); setErrores({}) }} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            color: 'var(--c-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', marginBottom: 16, padding: 0,
          }}>
            <ArrowLeft size={16} strokeWidth={2.5} /> Volver
          </button>
        )}

        {modo === 'registro' && (
          <div style={inputWrap}>
            <User size={16} strokeWidth={1.8} style={iconStyle} />
            <input placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)}
              onKeyDown={handleKeyDown} style={errores.nombre ? inputError : inputStyle} />
            {errores.nombre && <div style={errorTextStyle}>{errores.nombre}</div>}
          </div>
        )}

        <div style={inputWrap}>
          <Mail size={16} strokeWidth={1.8} style={iconStyle} />
          <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown} style={errores.email ? inputError : inputStyle} />
          {errores.email && <div style={errorTextStyle}>{errores.email}</div>}
        </div>

        {modo !== 'reset' && (
          <div style={inputWrap}>
            <Lock size={16} strokeWidth={1.8} style={iconStyle} />
            <input placeholder="Contraseña" type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
              style={errores.password ? inputError : inputStyle} />
            <button onClick={() => setShowPassword(!showPassword)} style={{
              position: 'absolute', right: 12, top: 12, background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--c-muted)', padding: 4,
            }}>
              {showPassword ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
            </button>
            {errores.password && <div style={errorTextStyle}>{errores.password}</div>}
          </div>
        )}

        {modo === 'registro' && (
          <div style={inputWrap}>
            <Phone size={16} strokeWidth={1.8} style={iconStyle} />
            <input placeholder="Teléfono (opcional)" value={telefono} onChange={e => setTelefono(e.target.value)}
              onKeyDown={handleKeyDown} style={errores.telefono ? inputError : inputStyle} />
            {errores.telefono && <div style={errorTextStyle}>{errores.telefono}</div>}
          </div>
        )}

        {error && (
          <div style={{
            background: '#FEF2F2', color: '#DC2626', fontSize: 12, padding: '10px 14px',
            borderRadius: 10, marginBottom: 12, textAlign: 'center', fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
          background: loading ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff',
          fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer',
          fontFamily: 'inherit', marginTop: 6, transition: 'background 0.2s',
        }}>
          {loading ? 'Cargando...' : modo === 'login' ? 'Entrar' : modo === 'registro' ? 'Crear cuenta' : 'Enviar enlace'}
        </button>

        {modo === 'login' && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => { setModo('reset'); setError(null); setErrores({}) }} style={{
              background: 'none', border: 'none', color: 'var(--c-primary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {modo === 'registro' && (
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--c-muted)', lineHeight: 1.4 }}>
            Al registrarte aceptas nuestros términos y condiciones
          </div>
        )}
      </div>
    </div>
  )
}
