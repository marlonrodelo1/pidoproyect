import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRest } from '../context/RestContext'

export default function Ajustes() {
  const { restaurante, updateRestaurante, logout } = useRest()
  const [activo, setActivo] = useState(restaurante?.activo ?? true)
  const logoRef = useRef()
  const bannerRef = useRef()

  async function toggleActivo() {
    const nuevo = !activo
    setActivo(nuevo)
    await updateRestaurante({ activo: nuevo })
  }

  async function subirImagen(file, bucket, field) {
    const ext = file.name.split('.').pop()
    const path = `establecimientos/${restaurante.id}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) { alert('Error al subir: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    await updateRestaurante({ [field]: publicUrl })
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>Ajustes</h2>

      {/* Estado abierto/cerrado */}
      <div style={{ background: activo ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', borderRadius: 14, padding: '16px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: activo ? '#4ADE80' : '#EF4444' }}>{activo ? 'Abierto' : 'Cerrado'}</div>
          <div style={{ fontSize: 12, color: activo ? '#22C55E' : '#EF4444', marginTop: 2 }}>{activo ? 'Recibiendo pedidos' : 'No se reciben pedidos'}</div>
        </div>
        <button onClick={toggleActivo} style={{ width: 52, height: 28, borderRadius: 14, border: 'none', background: activo ? '#16A34A' : 'rgba(255,255,255,0.2)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
          <span style={{ position: 'absolute', top: 3, left: activo ? 27 : 3, width: 22, height: 22, borderRadius: 11, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
      </div>

      {/* Logo */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Logo</h3>
        <input ref={logoRef} type="file" accept="image/*" hidden onChange={e => e.target.files[0] && subirImagen(e.target.files[0], 'logos', 'logo_url')} />
        <div onClick={() => logoRef.current?.click()} style={{ width: 100, height: 100, borderRadius: 20, background: 'var(--c-surface2)', border: '2px dashed var(--c-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: '0 auto 12px', overflow: 'hidden' }}>
          {restaurante?.logo_url ? <img src={restaurante.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><span style={{ fontSize: 28, marginBottom: 4 }}>📷</span><span style={{ fontSize: 10, color: 'var(--c-muted)', fontWeight: 600 }}>Subir logo</span></>}
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-muted)' }}>200 × 200 px recomendado · PNG o JPG</div>
      </div>

      {/* Banner */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Banner</h3>
        <input ref={bannerRef} type="file" accept="image/*" hidden onChange={e => e.target.files[0] && subirImagen(e.target.files[0], 'banners', 'banner_url')} />
        <div onClick={() => bannerRef.current?.click()} style={{ width: '100%', height: 100, borderRadius: 14, background: 'var(--c-surface2)', border: '2px dashed var(--c-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 12, overflow: 'hidden' }}>
          {restaurante?.banner_url ? <img src={restaurante.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><span style={{ fontSize: 28, marginBottom: 4 }}>🖼️</span><span style={{ fontSize: 10, color: 'var(--c-muted)', fontWeight: 600 }}>Subir banner</span></>}
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-muted)' }}>800 × 300 px recomendado · PNG o JPG</div>
      </div>

      {/* Info */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Información</h3>
        {[
          { l: 'Nombre', v: restaurante?.nombre },
          { l: 'Tipo', v: restaurante?.tipo },
          { l: 'Dirección', v: restaurante?.direccion },
          { l: 'Email', v: restaurante?.email },
          { l: 'Teléfono', v: restaurante?.telefono },
          { l: 'Radio cobertura', v: `${restaurante?.radio_cobertura_km} km` },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--c-border)' : 'none' }}>
            <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>{item.l}</span>
            <span style={{ fontSize: 13, fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{item.v || '—'}</span>
          </div>
        ))}
      </div>

      <button onClick={logout} style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar sesión</button>
    </div>
  )
}
