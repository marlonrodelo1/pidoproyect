import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRest } from '../context/RestContext'
import { startAlarm, stopAlarm } from '../lib/alarm'

function PagoBadge({ pago }) {
  const t = pago === 'tarjeta'
  return <span style={{ background: t ? '#DBEAFE' : '#DCFCE7', color: t ? '#1E40AF' : '#166534', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{t ? '💳' : '💵'} {t ? 'Tarjeta' : 'Efectivo'}</span>
}
function CanalBadge({ canal }) {
  return <span style={{ background: canal === 'pidogo' ? '#F3E8FF' : '#FFF7ED', color: canal === 'pidogo' ? '#6B21A8' : '#C2410C', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{canal === 'pidogo' ? '🛵 PIDOGO' : '📱 PIDO'}</span>
}
function EstadoBadge({ estado }) {
  const c = { preparando: { bg: '#FEF3C7', c: '#92400E' }, listo: { bg: '#DCFCE7', c: '#166534' }, nuevo: { bg: '#DBEAFE', c: '#1E40AF' } }[estado] || { bg: '#F3F2EF', c: '#8C8A85' }
  return <span style={{ background: c.bg, color: c.c, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize' }}>{estado?.replace('_', ' ')}</span>
}

export default function PedidosEnVivo() {
  const { restaurante } = useRest()
  const [entrantes, setEntrantes] = useState([])
  const [activos, setActivos] = useState([])
  const [itemsMap, setItemsMap] = useState({})
  const [timers, setTimers] = useState({})

  useEffect(() => {
    if (!restaurante) return
    fetchPedidos()

    const channel = supabase.channel('pedidos-rest')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'pedidos',
        filter: `establecimiento_id=eq.${restaurante.id}`,
      }, payload => {
        setEntrantes(prev => [payload.new, ...prev])
        setTimers(prev => ({ ...prev, [payload.new.id]: 180 }))
        // Alarma sonora
        startAlarm()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurante?.id])

  // Countdown
  useEffect(() => {
    if (entrantes.length === 0) return
    const i = setInterval(() => {
      setTimers(prev => {
        const n = { ...prev }
        Object.keys(n).forEach(id => { if (n[id] > 0) n[id] -= 1 })
        return n
      })
    }, 1000)
    return () => clearInterval(i)
  }, [entrantes.length])

  async function fetchPedidos() {
    const { data: nuevos } = await supabase.from('pedidos').select('*').eq('establecimiento_id', restaurante.id).eq('estado', 'nuevo').order('created_at', { ascending: false })
    const { data: prep } = await supabase.from('pedidos').select('*').eq('establecimiento_id', restaurante.id).in('estado', ['aceptado', 'preparando', 'listo']).order('created_at', { ascending: false })

    setEntrantes(nuevos || [])
    setActivos(prep || [])

    const t = {}
    for (const p of nuevos || []) t[p.id] = 180
    setTimers(t)

    // Cargar items
    const allIds = [...(nuevos || []), ...(prep || [])].map(p => p.id)
    if (allIds.length > 0) {
      const { data: items } = await supabase.from('pedido_items').select('*').in('pedido_id', allIds)
      const map = {}
      for (const item of items || []) {
        if (!map[item.pedido_id]) map[item.pedido_id] = []
        map[item.pedido_id].push(item)
      }
      setItemsMap(map)
    }
  }

  async function aceptarPedido(pedido, minutos) {
    await supabase.from('pedidos').update({ estado: 'preparando', minutos_preparacion: minutos, aceptado_at: new Date().toISOString() }).eq('id', pedido.id)
    setEntrantes(prev => {
      const remaining = prev.filter(p => p.id !== pedido.id)
      if (remaining.length === 0) stopAlarm()
      return remaining
    })
    setActivos(prev => [{ ...pedido, estado: 'preparando', minutos_preparacion: minutos }, ...prev])
    setTimers(prev => { const n = { ...prev }; delete n[pedido.id]; return n })
  }

  async function rechazarPedido(id) {
    await supabase.from('pedidos').update({ estado: 'cancelado' }).eq('id', id)
    setEntrantes(prev => {
      const remaining = prev.filter(p => p.id !== id)
      if (remaining.length === 0) stopAlarm()
      return remaining
    })
  }

  async function marcarListo(id) {
    await supabase.from('pedidos').update({ estado: 'listo' }).eq('id', id)
    setActivos(prev => prev.map(p => p.id === id ? { ...p, estado: 'listo' } : p))
  }

  async function marcarRecogido(id) {
    await supabase.from('pedidos').update({ estado: 'recogido', recogido_at: new Date().toISOString() }).eq('id', id)
    setActivos(prev => prev.filter(p => p.id !== id))
  }

  const formatTimer = s => { const m = Math.floor((s || 180) / 60); const sec = (s || 180) % 60; return `${m}:${sec.toString().padStart(2, '0')}` }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>Pedidos en vivo</h2>

      {/* Alerta */}
      {entrantes.length > 0 && (
        <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #FEE2E2', animation: 'pulse 1s ease-in-out infinite' }}>
          <span style={{ fontSize: 18 }}>🔔</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B' }}>{entrantes.length} pedido{entrantes.length > 1 ? 's' : ''} esperando</div>
            <div style={{ fontSize: 10, color: '#B91C1C' }}>Acepta o rechaza</div>
          </div>
        </div>
      )}

      {/* Pedidos nuevos */}
      {entrantes.map(p => (
        <div key={p.id} style={{ background: 'linear-gradient(135deg, var(--c-primary), #D94420)', borderRadius: 16, padding: 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{p.codigo}</span>
              <PagoBadge pago={p.metodo_pago} />
            </div>
            <div style={{
              background: (timers[p.id] || 180) < 60 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)',
              borderRadius: 8, padding: '4px 10px',
              color: (timers[p.id] || 180) < 60 ? '#B91C1C' : '#fff',
              fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
              animation: (timers[p.id] || 180) < 60 ? 'pulse 0.5s ease-in-out infinite' : 'none',
            }}>{formatTimer(timers[p.id])}</div>
          </div>
          <CanalBadge canal={p.canal} />

          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px', margin: '10px 0' }}>
            {(itemsMap[p.id] || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: 12, marginBottom: 4 }}>
                <span>{item.cantidad}x {item.nombre_producto}</span>
                <span style={{ fontWeight: 700 }}>{(item.precio_unitario * item.cantidad).toFixed(2)} €</span>
              </div>
            ))}
          </div>

          {p.notas && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 10, fontStyle: 'italic' }}>Nota: {p.notas}</div>}

          <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 14 }}>
            Total: {p.total.toFixed(2)} €
            {p.metodo_pago === 'efectivo' && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 8, opacity: 0.7 }}>Cobrar en efectivo</span>}
          </div>

          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Tiempo de preparación:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[15, 20, 30, 45].map(min => (
              <button key={min} onClick={() => aceptarPedido(p, min)} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: '#fff', color: 'var(--c-primary)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{min} min</button>
            ))}
          </div>
          <button onClick={() => rechazarPedido(p.id)} style={{ width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 10, border: '2px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rechazar</button>
        </div>
      ))}

      {/* En preparación */}
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>En preparación ({activos.length})</div>
      {activos.length === 0 && entrantes.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-muted)', fontSize: 13 }}>Esperando nuevos pedidos...</div>}

      {activos.map(p => (
        <div key={p.id} style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 16, border: p.estado === 'listo' ? '2px solid #16A34A' : '1px solid var(--c-border)', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{p.codigo}</span>
              <EstadoBadge estado={p.estado} />
              <PagoBadge pago={p.metodo_pago} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 6 }}>
            {(itemsMap[p.id] || []).map(i => `${i.cantidad}x ${i.nombre_producto}`).join(', ')}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{p.total.toFixed(2)} €</div>

          {p.estado === 'preparando' && (
            <button onClick={() => marcarListo(p.id)} style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Pedido listo para recoger</button>
          )}
          {p.estado === 'listo' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: '#DCFCE7', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#166534' }}>Esperando repartidor</div>
              <button onClick={() => marcarRecogido(p.id)} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--c-primary)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Recogido</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
