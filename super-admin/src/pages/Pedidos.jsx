import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Pedidos() {
  const [items, setItems] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [filtroPago, setFiltroPago] = useState('todos')
  const [filtroCanal, setFiltroCanal] = useState('todos')
  const [detalle, setDetalle] = useState(null)
  const [detalleItems, setDetalleItems] = useState([])

  useEffect(() => {
    load()
    const channel = supabase.channel('admin-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function load() {
    const { data } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(200)
    setItems(data || [])
  }

  async function verDetalle(p) {
    setDetalle(p)
    const { data } = await supabase.from('pedido_items').select('*').eq('pedido_id', p.id)
    setDetalleItems(data || [])
  }

  async function cancelarPedido(id) {
    await supabase.from('pedidos').update({ estado: 'cancelado' }).eq('id', id)
    setDetalle(null)
    load()
  }

  const filtrados = items.filter(p => {
    if (filtro !== 'todos' && p.estado !== filtro) return false
    if (filtroPago !== 'todos' && p.metodo_pago !== filtroPago) return false
    if (filtroCanal !== 'todos' && p.canal !== filtroCanal) return false
    return true
  })

  const estadoColor = { nuevo: '#3B82F6', aceptado: '#F59E0B', preparando: '#F59E0B', listo: '#8B5CF6', recogido: '#8B5CF6', en_camino: '#3B82F6', entregado: '#16A34A', cancelado: '#EF4444', fallido: '#EF4444' }
  const estados = ['todos', 'nuevo', 'aceptado', 'preparando', 'listo', 'en_camino', 'entregado', 'cancelado']

  if (detalle) {
    return (
      <div>
        <button onClick={() => setDetalle(null)} style={styles.backBtn}>← Volver</button>
        <div style={styles.detalleCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{detalle.codigo}</h2>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <span style={{ ...styles.badge, background: (estadoColor[detalle.estado] || '#6B7280') + '15', color: estadoColor[detalle.estado] }}>{detalle.estado}</span>
                <span style={{ ...styles.badge, background: detalle.metodo_pago === 'tarjeta' ? '#DBEAFE' : '#FEF3C7', color: detalle.metodo_pago === 'tarjeta' ? '#1D4ED8' : '#92400E' }}>{detalle.metodo_pago}</span>
                <span style={{ ...styles.badge, background: detalle.canal === 'pido' ? '#FFF3ED' : '#F0FDF4', color: detalle.canal === 'pido' ? '#FF6B2C' : '#166534' }}>{detalle.canal}</span>
              </div>
            </div>
            {detalle.estado !== 'cancelado' && detalle.estado !== 'entregado' && (
              <button onClick={() => cancelarPedido(detalle.id)} style={{ ...styles.actionBtn, color: '#EF4444', padding: '6px 14px' }}>Cancelar pedido</button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 24 }}>
            <div><strong>Subtotal:</strong> {detalle.subtotal?.toFixed(2)}EUR</div>
            <div><strong>Envio:</strong> {detalle.coste_envio?.toFixed(2)}EUR</div>
            <div><strong>Propina:</strong> {detalle.propina?.toFixed(2)}EUR</div>
            <div><strong>Total:</strong> <span style={{ fontWeight: 800 }}>{detalle.total?.toFixed(2)}EUR</span></div>
            <div><strong>Direccion:</strong> {detalle.direccion_entrega || '-'}</div>
            <div><strong>Notas:</strong> {detalle.notas || '-'}</div>
            <div><strong>Preparacion:</strong> {detalle.minutos_preparacion || '-'} min</div>
            <div><strong>Creado:</strong> {new Date(detalle.created_at).toLocaleString('es-ES')}</div>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Items del pedido</h3>
          <div style={{ background: '#F9FAFB', borderRadius: 10, overflow: 'hidden' }}>
            {detalleItems.map(item => (
              <div key={item.id} style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{item.cantidad}x</span> {item.nombre_producto}
                  {item.tamano && <span style={{ color: '#9CA3AF' }}> ({item.tamano})</span>}
                  {item.extras?.length > 0 && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>+ {item.extras.join(', ')}</div>}
                  {item.notas && <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 2 }}>{item.notas}</div>}
                </div>
                <span style={{ fontWeight: 700 }}>{(item.precio_unitario * item.cantidad).toFixed(2)}EUR</span>
              </div>
            ))}
            {detalleItems.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>Sin items</div>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Pedidos</h1>
        <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>{filtrados.length} pedidos</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {estados.map(e => (
          <button key={e} onClick={() => setFiltro(e)} style={{ ...styles.filterBtn, background: filtro === e ? '#FF6B2C' : '#F3F4F6', color: filtro === e ? '#fff' : '#6B7280' }}>
            {e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['todos', 'tarjeta', 'efectivo'].map(p => (
          <button key={p} onClick={() => setFiltroPago(p)} style={{ ...styles.filterBtn, background: filtroPago === p ? '#3B82F6' : '#F3F4F6', color: filtroPago === p ? '#fff' : '#6B7280' }}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <div style={{ width: 1, background: '#E5E7EB', margin: '0 4px' }} />
        {['todos', 'pido', 'pidogo'].map(c => (
          <button key={c} onClick={() => setFiltroCanal(c)} style={{ ...styles.filterBtn, background: filtroCanal === c ? '#8B5CF6' : '#F3F4F6', color: filtroCanal === c ? '#fff' : '#6B7280' }}>
            {c === 'todos' ? 'Canales' : c.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span style={{ width: 80 }}>Codigo</span>
          <span style={{ width: 80 }}>Total</span>
          <span style={{ width: 90 }}>Estado</span>
          <span style={{ width: 70 }}>Pago</span>
          <span style={{ width: 70 }}>Canal</span>
          <span style={{ flex: 1 }}>Fecha</span>
          <span style={{ width: 50 }}></span>
        </div>
        {filtrados.map(p => (
          <div key={p.id} style={styles.tableRow}>
            <span style={{ width: 80, fontWeight: 700, fontSize: 12 }}>{p.codigo}</span>
            <span style={{ width: 80, fontSize: 12 }}>{p.total?.toFixed(2)}EUR</span>
            <span style={{ width: 90 }}><span style={{ ...styles.badge, background: (estadoColor[p.estado] || '#6B7280') + '15', color: estadoColor[p.estado] }}>{p.estado}</span></span>
            <span style={{ width: 70 }}><span style={{ ...styles.badge, background: p.metodo_pago === 'tarjeta' ? '#DBEAFE' : '#FEF3C7', color: p.metodo_pago === 'tarjeta' ? '#1D4ED8' : '#92400E' }}>{p.metodo_pago}</span></span>
            <span style={{ width: 70 }}><span style={{ ...styles.badge, background: p.canal === 'pido' ? '#FFF3ED' : '#F0FDF4', color: p.canal === 'pido' ? '#FF6B2C' : '#166534' }}>{p.canal}</span></span>
            <span style={{ flex: 1, fontSize: 11, color: '#9CA3AF' }}>{new Date(p.created_at).toLocaleString('es-ES')}</span>
            <span style={{ width: 50 }}><button onClick={() => verDetalle(p)} style={styles.actionBtn}>Ver</button></span>
          </div>
        ))}
        {filtrados.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin pedidos</div>}
      </div>
    </div>
  )
}

const styles = {
  filterBtn: { padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  table: { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  tableHeader: { display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 12, fontSize: 11, fontWeight: 700, color: '#9CA3AF', borderBottom: '1px solid #F3F4F6', textTransform: 'uppercase' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 12, borderBottom: '1px solid #F9FAFB' },
  badge: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize' },
  actionBtn: { padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: '#F3F4F6', color: '#3B82F6' },
  backBtn: { background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: 16, padding: 0 },
  detalleCard: { background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
}
