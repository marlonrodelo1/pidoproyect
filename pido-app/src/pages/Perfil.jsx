import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCurrentPosition } from '../lib/geolocation'
import { MapPin, CreditCard, Tag, Settings, HelpCircle, LogOut, ChevronRight, X, Check, Camera, User, Phone, Mail, Navigation } from 'lucide-react'

export default function Perfil() {
  const { perfil, logout, updatePerfil } = useAuth()
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [subSeccion, setSubSeccion] = useState(null)

  // Dirección
  const [direccion, setDireccion] = useState(perfil?.direccion || '')
  const [savingDir, setSavingDir] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  const handleGuardar = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await updatePerfil({ nombre: nombre.trim(), apellido: apellido.trim(), telefono: telefono.trim() })
      setMsg('Perfil actualizado')
      setTimeout(() => { setEditando(false); setMsg(null) }, 1200)
    } catch { setMsg('Error al guardar') }
    finally { setSaving(false) }
  }

  const handleGuardarDir = async () => {
    setSavingDir(true)
    try {
      await updatePerfil({ direccion: direccion.trim() })
      setMsg('Dirección guardada')
      setTimeout(() => setMsg(null), 1500)
    } catch { setMsg('Error al guardar') }
    finally { setSavingDir(false) }
  }

  const handleGeolocalizar = async () => {
    setGeoLoading(true)
    try {
      const pos = await getCurrentPosition()
      // Reverse geocoding con Nominatim (gratis, no necesita API key)
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json&addressdetails=1`)
      const data = await res.json()
      const addr = data.display_name || `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`
      setDireccion(addr)
      await updatePerfil({ direccion: addr, latitud: pos.lat, longitud: pos.lng })
      setMsg('Ubicación actualizada')
      setTimeout(() => setMsg(null), 1500)
    } catch { setMsg('No se pudo obtener la ubicación') }
    finally { setGeoLoading(false) }
  }

  const menuItems = [
    { icon: MapPin, label: 'Mi dirección', action: () => setSubSeccion('direcciones') },
    { icon: CreditCard, label: 'Método de pago', action: () => setSubSeccion('pagos') },
    { icon: Tag, label: 'Promociones', action: () => setSubSeccion('promos') },
    { icon: Settings, label: 'Configuración', action: () => setSubSeccion('config') },
    { icon: HelpCircle, label: 'Ayuda', action: () => setSubSeccion('ayuda') },
  ]

  // Sub-secciones
  if (subSeccion) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <button onClick={() => { setSubSeccion(null); setMsg(null) }} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          color: 'var(--c-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', marginBottom: 20, padding: 0,
        }}>← Volver</button>

        {subSeccion === 'direcciones' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Mi dirección</h2>

            {/* Botón geolocalizar */}
            <button onClick={handleGeolocalizar} disabled={geoLoading} style={{
              width: '100%', padding: '14px 16px', borderRadius: 14, marginBottom: 12,
              background: 'rgba(255,107,44,0.1)', border: '1px solid rgba(255,107,44,0.2)',
              color: 'var(--c-primary)', fontSize: 13, fontWeight: 700, cursor: geoLoading ? 'default' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Navigation size={16} strokeWidth={2} />
              {geoLoading ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
            </button>

            <div style={{ ...glass, padding: 16 }}>
              <label style={labelStyle}>Dirección de entrega</label>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <MapPin size={15} strokeWidth={1.8} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--c-muted)' }} />
                <input value={direccion} onChange={e => setDireccion(e.target.value)}
                  placeholder="Ej: Calle Gran Vía 12, 3B" style={{ ...inputDark, paddingLeft: 38 }} />
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

            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--c-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Pulsa "Usar mi ubicación actual" para geolocalizarte automáticamente o escribe tu dirección manualmente
            </div>
          </>
        )}

        {subSeccion === 'pagos' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Método de pago</h2>
            <div style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 16 }}>Elige tu método preferido para próximos pedidos</div>
            {[
              { id: 'tarjeta', label: 'Tarjeta', emoji: '💳', desc: 'Pago seguro con Stripe' },
              { id: 'efectivo', label: 'Efectivo', emoji: '💵', desc: 'Paga al recibir tu pedido' },
            ].map(m => {
              const sel = perfil?.metodo_pago_preferido === m.id
              return (
                <button key={m.id} onClick={async () => { await updatePerfil({ metodo_pago_preferido: m.id }) }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                  borderRadius: 14, marginBottom: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  border: sel ? '2px solid var(--c-primary)' : '1px solid rgba(255,255,255,0.1)',
                  background: sel ? 'rgba(255,107,44,0.1)' : 'rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: 28 }}>{m.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: sel ? 'var(--c-primary)' : '#F5F5F5' }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{m.desc}</div>
                  </div>
                  {sel && <Check size={18} color="var(--c-primary)" />}
                </button>
              )
            })}
          </>
        )}

        {subSeccion === 'promos' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Promociones</h2>
            <div style={{ ...glass, padding: 24, textAlign: 'center' }}>
              <Tag size={32} strokeWidth={1.5} color="var(--c-muted)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Sin promociones activas</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.4 }}>Las promociones aparecerán aquí cuando estén disponibles</div>
            </div>
          </>
        )}

        {subSeccion === 'config' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Configuración</h2>
            <div style={{ ...glass }}>
              {[{ label: 'Notificaciones', desc: 'Activadas' }, { label: 'Idioma', desc: 'Español' }].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
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
            <div style={glass}>
              {[
                { q: '¿Cómo hago un pedido?', a: 'Elige un restaurante, añade productos al carrito y confirma tu pedido.' },
                { q: '¿Cómo contacto con soporte?', a: 'Escríbenos a soporte@pidoo.es' },
                { q: '¿Puedo cancelar un pedido?', a: 'Puedes cancelar antes de que el restaurante acepte tu pedido.' },
              ].map((item, i) => (
                <details key={i} style={{ padding: '14px 16px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <summary style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
                    {item.q} <ChevronRight size={14} color="var(--c-muted)" />
                  </summary>
                  <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 8, lineHeight: 1.5 }}>{item.a}</div>
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
          <button onClick={() => {
            setNombre(perfil?.nombre || ''); setApellido(perfil?.apellido || ''); setTelefono(perfil?.telefono || '')
            setEditando(true)
          }} style={{
            position: 'absolute', bottom: -4, right: -4, width: 28, height: 28,
            borderRadius: 10, background: '#1A1A1A', border: '2px solid rgba(255,255,255,0.15)',
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
          setNombre(perfil?.nombre || ''); setApellido(perfil?.apellido || ''); setTelefono(perfil?.telefono || '')
          setEditando(true)
        }} style={{
          marginTop: 10, padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
          background: 'transparent', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', color: 'var(--c-primary)',
        }}>
          Editar perfil
        </button>
      </div>

      {/* Menu */}
      <div style={{ ...glass, borderRadius: 14 }}>
        {menuItems.map((item, i) => (
          <button key={i} onClick={item.action} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            width: '100%', padding: '14px 16px', border: 'none', background: 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontFamily: 'inherit',
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
          color: '#EF4444', textAlign: 'left',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogOut size={18} strokeWidth={1.8} color="#EF4444" />
            Cerrar sesión
          </span>
          <ChevronRight size={16} strokeWidth={1.8} color="var(--c-muted)" />
        </button>
      </div>

      {/* Modal Editar Perfil */}
      {editando && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={e => e.target === e.currentTarget && setEditando(false)}>
          <div style={{
            width: '100%', maxWidth: 420, background: '#1A1A1A',
            borderRadius: '20px 20px 0 0', padding: 24,
            animation: 'slideUp 0.3s ease',
            border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#F5F5F5' }}>Editar perfil</h3>
              <button onClick={() => setEditando(false)} style={{
                width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.1)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={16} strokeWidth={2} color="#F5F5F5" />
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" style={inputDark} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Apellido</label>
              <input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Apellido" style={inputDark} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Teléfono</label>
              <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Teléfono" style={inputDark} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email</label>
              <input value={perfil?.email || ''} disabled style={{ ...inputDark, opacity: 0.4, cursor: 'not-allowed' }} />
            </div>

            {msg && (
              <div style={{
                textAlign: 'center', fontSize: 12, fontWeight: 600, marginBottom: 14,
                color: msg.includes('Error') ? '#EF4444' : '#22C55E',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <Check size={14} /> {msg}
              </div>
            )}

            <button onClick={handleGuardar} disabled={saving} style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: saving ? 'rgba(255,255,255,0.2)' : 'var(--c-primary)', color: '#fff',
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

const glass = {
  background: 'rgba(255,255,255,0.06)', borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
}

const inputDark = {
  width: '100%', padding: '14px 16px', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.15)', fontSize: 14, fontFamily: 'inherit',
  background: 'rgba(255,255,255,0.08)', color: '#F5F5F5', outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)',
  marginBottom: 6, display: 'block',
}
