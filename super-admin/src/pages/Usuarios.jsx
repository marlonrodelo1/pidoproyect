import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ds } from '../lib/darkStyles'

export default function Usuarios() {
  const [items, setItems] = useState([])
  const [buscar, setBuscar] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [pedidosUsuario, setPedidosUsuario] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  async function verDetalle(u) {
    setDetalle(u)
    const { data } = await supabase.from('pedidos').select('id, codigo, total, estado, metodo_pago, created_at')
      .eq('usuario_id', u.id).order('created_at', { ascending: false }).limit(20)
    setPedidosUsuario(data || [])
  }

  const filtrados = items.filter(u => {
    if (buscar && !u.nombre.toLowerCase().includes(buscar.toLowerCase()) && !u.email.toLowerCase().includes(buscar.toLowerCase())) return false
    return true
  })

  const estadoColor = { entregado: '#16A34A', cancelado: '#EF4444', fallido: '#EF4444' }

  if (detalle) {
    return (
      <div>
        <button onClick={() => setDetalle(null)} style={ds.backBtn}>← Volver</button>
        <div style={ds.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#818CF8', overflow: 'hidden' }}>
              {detalle.avatar_url ? <img src={detalle.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : detalle.nombre?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F5F5F5' }}>{detalle.nombre} {detalle.apellido || ''}</h2>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{detalle.email}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 24, color: '#F5F5F5' }}>
            <div><strong>Telefono:</strong> {detalle.telefono || '-'}</div>
            <div><strong>Direccion:</strong> {detalle.direccion || '-'}</div>
            <div><strong>Registrado:</strong> {new Date(detalle.created_at).toLocaleDateString('es-ES')}</div>
            <div><strong>Favoritos:</strong> {detalle.favoritos?.length || 0}</div>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#F5F5F5' }}>Historial de pedidos</h3>
          <div style={ds.table}>
            {pedidosUsuario.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#F5F5F5' }}>
                <span style={{ fontWeight: 700, width: 80 }}>{p.codigo}</span>
                <span style={{ width: 70 }}>{p.total?.toFixed(2)}EUR</span>
                <span style={{ ...ds.badge, background: (estadoColor[p.estado] || '#6B7280') + '15', color: estadoColor[p.estado] || '#6B7280' }}>{p.estado}</span>
                <span style={{ ...ds.badge, background: p.metodo_pago === 'tarjeta' ? 'rgba(29,78,216,0.15)' : 'rgba(245,158,11,0.15)', color: p.metodo_pago === 'tarjeta' ? '#60A5FA' : '#FBBF24' }}>{p.metodo_pago}</span>
                <span style={{ flex: 1, color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'right' }}>{new Date(p.created_at).toLocaleDateString('es-ES')}</span>
              </div>
            ))}
            {pedidosUsuario.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Sin pedidos</div>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={ds.h1}>Usuarios</h1>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{filtrados.length} total</span>
      </div>

      <input
        placeholder="Buscar por nombre o email..."
        value={buscar} onChange={e => setBuscar(e.target.value)}
        style={{ ...ds.input, marginBottom: 20, width: 280 }}
      />

      <div style={ds.table}>
        <div style={ds.tableHeader}>
          <span style={{ width: 44 }}></span>
          <span style={{ flex: 1 }}>Nombre</span>
          <span style={{ width: 180 }}>Email</span>
          <span style={{ width: 100 }}>Telefono</span>
          <span style={{ width: 100 }}>Registro</span>
          <span style={{ width: 60 }}>Accion</span>
        </div>
        {filtrados.map(u => (
          <div key={u.id} style={ds.tableRow}>
            <span style={{ width: 44 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#818CF8', overflow: 'hidden' }}>
                {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.nombre?.[0]?.toUpperCase()}
              </div>
            </span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{u.nombre} {u.apellido || ''}</span>
            <span style={{ width: 180, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{u.email}</span>
            <span style={{ width: 100, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{u.telefono || '-'}</span>
            <span style={{ width: 100, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{new Date(u.created_at).toLocaleDateString('es-ES')}</span>
            <span style={{ width: 60 }}>
              <button onClick={() => verDetalle(u)} style={ds.actionBtn}>Ver</button>
            </span>
          </div>
        ))}
        {filtrados.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Sin usuarios</div>}
      </div>
    </div>
  )
}
