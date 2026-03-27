import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { MapPin, CreditCard, Tag, Settings, HelpCircle, LogOut, ChevronRight, X, Check, Camera, User, Phone, Mail } from 'lucide-react'

export default function Perfil() {
  const { perfil, logout, updatePerfil } = useAuth()
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(perfil?.nombre || '')
  const [apellido, setApellido] = useState(perfil?.apellido || '')
  const [telefono, setTelefono] = useState(perfil?.telefono || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [subSeccion, setSubSeccion] = useState(null)
  const [direccion, setDireccion] = useState(perfil?.direccion || '')
  const [savingDir, setSavingDir] = useState(false)

  const handleGuardar = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await updatePerfil({ nombre: nombre.trim(), apellido: apellido.trim(), telefono: telefono.trim() })
      setMsg('Perfil actualizado')
      setTimeout(() => { setEditando(false); setMsg(null) }, 1200)
    } catch {
      setMsg('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleGuardarDir = async () => {
    setSavingDir(true)
    try {
      await updatePerfil({ direccion: direccion.trim() })
      setMsg('Dirección guardada')
      setTimeout(() => setMsg(null), 1500)
    } catch {
      setMsg('Error al guardar')
    } finally {
      setSavingDir(false)
    }
  }

  const menuItems = [
    { icon: MapPin, label: 'Mis direcciones', action: () => setSubSeccion('direcciones') },
    { icon: CreditCard, label: 'Métodos de pago', action: () => setSubSeccion('pagos') },
    { icon: Tag, label: 'Promociones', action: () => setSubSeccion('promos') },
    { icon: Settings, label: 'Configuración', action: () => setSubSeccion('config') },
    { icon: HelpCircle, label: 'Ayuda', action: () => setSubSeccion('ayuda') },
  ]

  const inputStyle = {
    width: '100%', padding: '12px 14px 12px 40px', borderRadius: 10,
    border: '1px solid var(--c-border)', fontSize: 14, fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.06)', color: 'var(--c-text)', outline: 'none',
    boxSizing: 'border-box',
  }
  const iconInput = { position: 'absolute', left: 12, top: 13, color: 'var(--c-muted)' }

  // Sub-secciones
  if (subSeccion) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <button onClick={() => { setSubSeccion(null); setMsg(null) }} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          color: 'var(--c-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', marginBottom: 20, padding: 0,
        }}>
          ← Volver
        </button>

        {subSeccion === 'direcciones' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Mis direcciones</h2>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid var(--c-border)', padding: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-muted)', marginBottom: 6, display: 'block' }}>
                Dirección de entrega
              </label>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <MapPin size={15} strokeWidth={1.8} style={iconInput} />
                <input value={direccion} onChange={e => setDireccion(e.target.value)}
                  placeholder="Ej: Calle Gran Vía 12, 3B" style={inputStyle} />
              </div>
              <button onClick={handleGuardarDir} disabled={savingDir} style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: savingDir ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: savingDir ? 'default' : 'pointer', fontFamily: 'inherit',
              }}>
                {savingDir ? 'Guardando...' : 'Guardar dirección'}
              </button>
              {msg && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-primary)', marginTop: 10, fontWeight: 600 }}>{msg}</div>}
            </div>
          </>
        )}

        {subSeccion === 'pagos' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Métodos de pago</h2>
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid var(--c-border)',
              padding: 24, textAlign: 'center',
            }}>
              <CreditCard size={32} strokeWidth={1.5} color="var(--c-muted)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>
                Paga al hacer tu pedido
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.4 }}>
                Puedes pagar con tarjeta o efectivo en cada pedido
              </div>
            </div>
          </>
        )}

        {subSeccion === 'promos' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Promociones</h2>
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid var(--c-border)',
              padding: 24, textAlign: 'center',
            }}>
              <Tag size={32} strokeWidth={1.5} color="var(--c-muted)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>
                Sin promociones activas
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.4 }}>
                Las promociones aparecerán aquí cuando estén disponibles
              </div>
            </div>
          </>
        )}

        {subSeccion === 'config' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Configuración</h2>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid var(--c-border)' }}>
              {[
                { label: 'Notificaciones', desc: 'Activadas' },
                { label: 'Idioma', desc: 'Español' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px', borderBottom: i === 0 ? '1px solid var(--c-border)' : 'none',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {subSeccion === 'ayuda' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Ayuda</h2>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid var(--c-border)' }}>
              {[
                { q: '¿Cómo hago un pedido?', a: 'Elige un restaurante, añade productos al carrito y confirma tu pedido.' },
                { q: '¿Cómo contacto con soporte?', a: 'Escríbenos a soporte@pidoo.es' },
                { q: '¿Puedo cancelar un pedido?', a: 'Puedes cancelar antes de que el restaurante acepte tu pedido.' },
              ].map((item, i) => (
                <details key={i} style={{
                  padding: '14px 16px',
                  borderBottom: i < 2 ? '1px solid var(--c-border)' : 'none',
                }}>
                  <summary style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
                    {item.q} <ChevronRight size={14} color="var(--c-muted)" />
                  </summary>
                  <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 8, lineHeight: 1.5 }}>
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Avatar y datos */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 22, background: 'var(--c-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, fontWeight: 800, color: '#fff', overflow: 'hidden',
          }}>
            {perfil?.avatar_url
              ? <img src={perfil.avatar_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover' }} />
              : (perfil?.nombre?.[0] || 'U').toUpperCase()
            }
          </div>
          <button onClick={() => setEditando(true)} style={{
            position: 'absolute', bottom: -4, right: -4, width: 28, height: 28,
            borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '2px solid var(--c-border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={13} strokeWidth={2} color="var(--c-primary)" />
          </button>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text)' }}>
          {perfil?.nombre} {perfil?.apellido || ''}
        </div>
        <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{perfil?.email}</div>
        {perfil?.telefono && <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{perfil.telefono}</div>}
        <button onClick={() => {
          setNombre(perfil?.nombre || '')
          setApellido(perfil?.apellido || '')
          setTelefono(perfil?.telefono || '')
          setEditando(true)
        }} style={{
          marginTop: 10, padding: '6px 16px', borderRadius: 8, border: '1px solid var(--c-border)',
          background: 'rgba(255,255,255,0.06)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', color: 'var(--c-primary)',
        }}>
          Editar perfil
        </button>
      </div>

      {/* Menu */}
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid var(--c-border)' }}>
        {menuItems.map((item, i) => (
          <button key={i} onClick={item.action} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            width: '100%', padding: '14px 16px', border: 'none', background: 'transparent',
            borderBottom: '1px solid var(--c-border)', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 14, fontWeight: 600, color: 'var(--c-text)', textAlign: 'left',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <item.icon size={18} strokeWidth={1.8} color="var(--c-muted)" />
              {item.label}
            </span>
            <ChevronRight size={16} strokeWidth={1.8} color="var(--c-muted)" />
          </button>
        ))}
        <button onClick={logout} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', padding: '14px 16px', border: 'none', background: 'transparent',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
          color: '#991B1B', textAlign: 'left',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogOut size={18} strokeWidth={1.8} color="#991B1B" />
            Cerrar sesión
          </span>
          <ChevronRight size={16} strokeWidth={1.8} color="var(--c-muted)" />
        </button>
      </div>

      {/* Modal Editar Perfil */}
      {editando && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={e => e.target === e.currentTarget && setEditando(false)}>
          <div style={{
            width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.06)',
            borderRadius: '20px 20px 0 0', padding: 24,
            animation: 'slideUp 0.3s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Editar perfil</h3>
              <button onClick={() => setEditando(false)} style={{
                width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div style={{ marginBottom: 12, position: 'relative' }}>
              <User size={15} strokeWidth={1.8} style={iconInput} />
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12, position: 'relative' }}>
              <User size={15} strokeWidth={1.8} style={iconInput} />
              <input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Apellido" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12, position: 'relative' }}>
              <Phone size={15} strokeWidth={1.8} style={iconInput} />
              <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Teléfono" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <Mail size={15} strokeWidth={1.8} style={iconInput} />
              <input value={perfil?.email || ''} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>

            {msg && (
              <div style={{
                textAlign: 'center', fontSize: 12, fontWeight: 600, marginBottom: 12,
                color: msg.includes('Error') ? '#EF4444' : '#22C55E',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <Check size={14} /> {msg}
              </div>
            )}

            <button onClick={handleGuardar} disabled={saving} style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: saving ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff',
              fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
            }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
