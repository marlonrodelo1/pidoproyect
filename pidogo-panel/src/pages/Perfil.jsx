import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useSocio } from '../context/SocioContext'

export default function Perfil() {
  const { socio, updateSocio, logout } = useSocio()
  const [modo, setModo] = useState(socio?.modo_entrega || 'ambos')
  const [radio, setRadio] = useState(socio?.radio_km || 10)
  const [enServicio, setEnServicio] = useState(socio?.en_servicio || false)
  const [redes, setRedes] = useState(socio?.redes || {})
  const [editandoRedes, setEditandoRedes] = useState(false)
  const logoRef = useRef(null)
  const bannerRef = useRef(null)

  async function toggleServicio() {
    const nuevo = !enServicio
    setEnServicio(nuevo)
    await updateSocio({ en_servicio: nuevo })
  }

  async function guardarModo(m) {
    setModo(m)
    await updateSocio({ modo_entrega: m })
  }

  async function guardarRadio(r) {
    setRadio(r)
    await updateSocio({ radio_km: r })
  }

  async function guardarRedes() {
    await updateSocio({ redes })
    setEditandoRedes(false)
  }

  async function subirImagen(file, bucket, field) {
    const ext = file.name.split('.').pop()
    const path = `${socio.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) { alert('Error al subir: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    await updateSocio({ [field]: publicUrl })
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>Mi perfil</h2>

      {/* Estado servicio */}
      <div style={{ background: enServicio ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', borderRadius: 14, padding: '16px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: enServicio ? '#4ADE80' : '#FBBF24' }}>{enServicio ? 'En servicio' : 'Fuera de servicio'}</div>
          <div style={{ fontSize: 12, color: enServicio ? '#22C55E' : '#F59E0B', marginTop: 2 }}>{enServicio ? 'Estás recibiendo pedidos' : 'No recibirás pedidos'}</div>
        </div>
        <button onClick={toggleServicio} style={{ width: 52, height: 28, borderRadius: 14, border: 'none', background: enServicio ? '#16A34A' : 'rgba(255,255,255,0.2)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
          <span style={{ position: 'absolute', top: 3, left: enServicio ? 27 : 3, width: 22, height: 22, borderRadius: 11, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
      </div>

      {/* Info */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Información</h3>
        {[
          { label: 'Nombre', value: socio?.nombre },
          { label: 'Nombre comercial', value: socio?.nombre_comercial },
          { label: 'Email', value: socio?.email },
          { label: 'Teléfono', value: socio?.telefono },
          { label: 'URL tienda', value: `socio.pidoo.es/${socio?.slug}`, url: `https://socio.pidoo.es/${socio?.slug}`, accent: true },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--c-border)' : 'none' }}>
            <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>{item.label}</span>
            {item.url ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-accent)', textDecoration: 'none' }}>{item.value}</a>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color: item.accent ? 'var(--c-accent)' : 'var(--c-text)' }}>{item.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* Modo entrega */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Modo de entrega</h3>
        {[
          { id: 'reparto', label: 'Reparto a domicilio', icon: '🛵', desc: 'Entregas los pedidos al cliente' },
          { id: 'recogida', label: 'Solo recogida', icon: '🏪', desc: 'El cliente recoge en el restaurante' },
          { id: 'ambos', label: 'Ambos', icon: '🔄', desc: 'Recogida y reparto disponibles' },
        ].map(m => (
          <button key={m.id} onClick={() => guardarModo(m.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px',
            borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 8,
            border: modo === m.id ? '2px solid var(--c-accent)' : '1px solid var(--c-border)',
            background: modo === m.id ? 'var(--c-accent-light)' : 'var(--c-surface)',
          }}>
            <span style={{ fontSize: 20 }}>{m.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{m.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Radio */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Radio de cobertura</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <input type="range" min="1" max="20" value={radio} onChange={e => guardarRadio(Number(e.target.value))} style={{ flex: 1, accentColor: '#FF5733' }} />
          <span style={{ minWidth: 50, textAlign: 'center', fontWeight: 800, fontSize: 16, color: 'var(--c-accent)' }}>{radio} km</span>
        </div>
      </div>

      {/* Logo */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Logo</h3>
        <input ref={logoRef} type="file" accept="image/*" hidden onChange={e => e.target.files[0] && subirImagen(e.target.files[0], 'logos', 'logo_url')} />
        <div onClick={() => logoRef.current?.click()} style={{ width: 100, height: 100, borderRadius: 20, background: 'var(--c-surface2)', border: '2px dashed var(--c-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: '0 auto 12px', overflow: 'hidden' }}>
          {socio?.logo_url ? <img src={socio.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><span style={{ fontSize: 28, marginBottom: 4 }}>📷</span><span style={{ fontSize: 10, color: 'var(--c-muted)', fontWeight: 600 }}>Subir logo</span></>}
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-muted)' }}>400 × 400 px · PNG o JPG · Máx 2 MB</div>
      </div>

      {/* Banner */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Banner</h3>
        <input ref={bannerRef} type="file" accept="image/*" hidden onChange={e => e.target.files[0] && subirImagen(e.target.files[0], 'banners', 'banner_url')} />
        <div onClick={() => bannerRef.current?.click()} style={{ width: '100%', height: 100, borderRadius: 14, background: 'var(--c-surface2)', border: '2px dashed var(--c-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 12, overflow: 'hidden' }}>
          {socio?.banner_url ? <img src={socio.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><span style={{ fontSize: 28, marginBottom: 4 }}>🖼️</span><span style={{ fontSize: 10, color: 'var(--c-muted)', fontWeight: 600 }}>Subir banner</span></>}
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-muted)' }}>1200 × 400 px · PNG o JPG · Máx 5 MB</div>
      </div>

      {/* Redes */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Redes sociales</h3>
          <button onClick={() => editandoRedes ? guardarRedes() : setEditandoRedes(true)} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: 'var(--c-accent)', cursor: 'pointer', fontFamily: 'inherit' }}>{editandoRedes ? 'Guardar' : 'Editar'}</button>
        </div>
        {[
          { key: 'instagram', label: 'Instagram', icon: '📸', prefix: '@' },
          { key: 'tiktok', label: 'TikTok', icon: '🎵', prefix: '@' },
          { key: 'whatsapp', label: 'WhatsApp', icon: '💬', prefix: '' },
        ].map((red, i) => (
          <div key={red.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--c-border)' : 'none' }}>
            <span style={{ fontSize: 18 }}>{red.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 2 }}>{red.label}</div>
              {editandoRedes ? (
                <input type="text" value={redes[red.key] || ''} onChange={e => setRedes({ ...redes, [red.key]: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--c-border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--c-surface2)', color: 'var(--c-text)', outline: 'none' }} />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600 }}>{redes[red.key] ? `${red.prefix}${redes[red.key]}` : 'No configurado'}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cerrar sesión */}
      <button onClick={logout} style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar sesión</button>
    </div>
  )
}
