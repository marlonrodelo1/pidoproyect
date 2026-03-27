import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Socios() {
  const [items, setItems] = useState([])
  const [buscar, setBuscar] = useState('')
  const [detalle, setDetalle] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('socios').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  async function toggleActivo(id, activo) {
    await supabase.from('socios').update({ activo: !activo }).eq('id', id)
    load()
  }

  const filtrados = items.filter(s => {
    if (buscar && !s.nombre.toLowerCase().includes(buscar.toLowerCase()) && !s.nombre_comercial?.toLowerCase().includes(buscar.toLowerCase())) return false
    return true
  })

  if (detalle) {
    return (
      <div>
        <button onClick={() => setDetalle(null)} style={styles.backBtn}>← Volver</button>
        <div style={styles.detalleCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: '#FF5733', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', overflow: 'hidden' }}>
              {detalle.logo_url ? <img src={detalle.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : detalle.nombre_comercial?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{detalle.nombre}</h2>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{detalle.nombre_comercial} · /{detalle.slug}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <span style={{ ...styles.badge, background: detalle.activo ? '#DCFCE7' : '#FEE2E2', color: detalle.activo ? '#166534' : '#991B1B' }}>{detalle.activo ? 'Activo' : 'Inactivo'}</span>
              <span style={{ ...styles.badge, background: detalle.en_servicio ? '#DBEAFE' : '#F3F4F6', color: detalle.en_servicio ? '#1D4ED8' : '#9CA3AF' }}>{detalle.en_servicio ? 'En servicio' : 'Fuera'}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><strong>Email:</strong> {detalle.email || '-'}</div>
            <div><strong>Telefono:</strong> {detalle.telefono || '-'}</div>
            <div><strong>Modo entrega:</strong> {detalle.modo_entrega}</div>
            <div><strong>Radio:</strong> {detalle.radio_km} km</div>
            <div><strong>Rating:</strong> {detalle.rating?.toFixed(1)} ({detalle.total_resenas} resenas)</div>
            <div><strong>Creado:</strong> {new Date(detalle.created_at).toLocaleDateString('es-ES')}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Socios / Riders</h1>
        <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>{filtrados.length} total</span>
      </div>

      <input
        placeholder="Buscar por nombre..."
        value={buscar} onChange={e => setBuscar(e.target.value)}
        style={{ ...styles.input, marginBottom: 20 }}
      />

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span style={{ width: 44 }}></span>
          <span style={{ flex: 1 }}>Nombre</span>
          <span style={{ width: 120 }}>Comercial</span>
          <span style={{ width: 80 }}>Modo</span>
          <span style={{ width: 60 }}>Rating</span>
          <span style={{ width: 80 }}>Estado</span>
          <span style={{ width: 100 }}>Acciones</span>
        </div>
        {filtrados.map(s => (
          <div key={s.id} style={styles.tableRow}>
            <span style={{ width: 44 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FF5733', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden' }}>
                {s.logo_url ? <img src={s.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.nombre_comercial?.[0]?.toUpperCase()}
              </div>
            </span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13, cursor: 'pointer' }} onClick={() => setDetalle(s)}>{s.nombre}</span>
            <span style={{ width: 120, fontSize: 12, color: '#6B7280' }}>{s.nombre_comercial}</span>
            <span style={{ width: 80 }}><span style={{ ...styles.badge, background: '#F3F4F6', color: '#6B7280' }}>{s.modo_entrega}</span></span>
            <span style={{ width: 60, fontSize: 12 }}>{s.rating?.toFixed(1)}</span>
            <span style={{ width: 80 }}>
              <span style={{ ...styles.badge, background: s.activo ? '#DCFCE7' : '#FEE2E2', color: s.activo ? '#166534' : '#991B1B' }}>{s.activo ? 'Activo' : 'Inactivo'}</span>
            </span>
            <span style={{ width: 100, display: 'flex', gap: 6 }}>
              <button onClick={() => setDetalle(s)} style={styles.actionBtn}>Ver</button>
              <button onClick={() => toggleActivo(s.id, s.activo)} style={{ ...styles.actionBtn, color: s.activo ? '#EF4444' : '#16A34A' }}>
                {s.activo ? 'Desactivar' : 'Activar'}
              </button>
            </span>
          </div>
        ))}
        {filtrados.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin socios</div>}
      </div>
    </div>
  )
}

const styles = {
  input: { padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: "'DM Sans', sans-serif", width: 280, outline: 'none' },
  table: { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  tableHeader: { display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 12, fontSize: 11, fontWeight: 700, color: '#9CA3AF', borderBottom: '1px solid #F3F4F6', textTransform: 'uppercase' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 12, borderBottom: '1px solid #F9FAFB' },
  badge: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 },
  actionBtn: { padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: '#F3F4F6', color: '#3B82F6' },
  backBtn: { background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: 16, padding: 0 },
  detalleCard: { background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
}
