import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Establecimientos() {
  const [items, setItems] = useState([])
  const [buscar, setBuscar] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [detalle, setDetalle] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('establecimientos').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  async function toggleActivo(id, activo) {
    await supabase.from('establecimientos').update({ activo: !activo }).eq('id', id)
    load()
  }

  const filtrados = items.filter(e => {
    if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false
    if (buscar && !e.nombre.toLowerCase().includes(buscar.toLowerCase())) return false
    return true
  })

  const tipos = ['todos', ...new Set(items.map(e => e.tipo).filter(Boolean))]

  if (detalle) {
    return (
      <div>
        <button onClick={() => setDetalle(null)} style={styles.backBtn}>← Volver</button>
        <div style={styles.detalleCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, overflow: 'hidden' }}>
              {detalle.logo_url ? <img src={detalle.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{detalle.nombre}</h2>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{detalle.tipo} · {detalle.categoria_padre}</div>
            </div>
            <span style={{
              ...styles.badge, marginLeft: 'auto',
              background: detalle.activo ? '#DCFCE7' : '#FEE2E2',
              color: detalle.activo ? '#166534' : '#991B1B',
            }}>{detalle.activo ? 'Activo' : 'Inactivo'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><strong>Email:</strong> {detalle.email || '-'}</div>
            <div><strong>Telefono:</strong> {detalle.telefono || '-'}</div>
            <div><strong>Direccion:</strong> {detalle.direccion || '-'}</div>
            <div><strong>Radio:</strong> {detalle.radio_cobertura_km} km</div>
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
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Establecimientos</h1>
        <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>{filtrados.length} total</span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por nombre..."
          value={buscar} onChange={e => setBuscar(e.target.value)}
          style={styles.input}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {tipos.map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)} style={{
              ...styles.filterBtn,
              background: filtroTipo === t ? '#FF6B2C' : '#F3F4F6',
              color: filtroTipo === t ? '#fff' : '#6B7280',
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span style={{ width: 44 }}></span>
          <span style={{ flex: 1 }}>Nombre</span>
          <span style={{ width: 100 }}>Tipo</span>
          <span style={{ width: 60 }}>Rating</span>
          <span style={{ width: 80 }}>Estado</span>
          <span style={{ width: 100 }}>Acciones</span>
        </div>
        {filtrados.map(e => (
          <div key={e.id} style={styles.tableRow}>
            <span style={{ width: 44 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, overflow: 'hidden' }}>
                {e.logo_url ? <img src={e.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
              </div>
            </span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13, cursor: 'pointer' }} onClick={() => setDetalle(e)}>{e.nombre}</span>
            <span style={{ width: 100 }}><span style={{ ...styles.badge, background: '#F3F4F6', color: '#6B7280' }}>{e.tipo}</span></span>
            <span style={{ width: 60, fontSize: 12 }}>{e.rating?.toFixed(1)}</span>
            <span style={{ width: 80 }}>
              <span style={{ ...styles.badge, background: e.activo ? '#DCFCE7' : '#FEE2E2', color: e.activo ? '#166534' : '#991B1B' }}>
                {e.activo ? 'Activo' : 'Inactivo'}
              </span>
            </span>
            <span style={{ width: 100, display: 'flex', gap: 6 }}>
              <button onClick={() => setDetalle(e)} style={styles.actionBtn}>Ver</button>
              <button onClick={() => toggleActivo(e.id, e.activo)} style={{ ...styles.actionBtn, color: e.activo ? '#EF4444' : '#16A34A' }}>
                {e.activo ? 'Desactivar' : 'Activar'}
              </button>
            </span>
          </div>
        ))}
        {filtrados.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin establecimientos</div>}
      </div>
    </div>
  )
}

const styles = {
  input: { padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: "'DM Sans', sans-serif", width: 260, outline: 'none' },
  filterBtn: { padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  table: { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  tableHeader: { display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 12, fontSize: 11, fontWeight: 700, color: '#9CA3AF', borderBottom: '1px solid #F3F4F6', textTransform: 'uppercase' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 12, borderBottom: '1px solid #F9FAFB' },
  badge: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 },
  actionBtn: { padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: '#F3F4F6', color: '#3B82F6' },
  backBtn: { background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: 16, padding: 0 },
  detalleCard: { background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
}
