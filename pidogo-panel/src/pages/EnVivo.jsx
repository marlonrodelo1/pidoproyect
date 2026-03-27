import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSocio } from '../context/SocioContext'
import { watchPosition, clearWatch } from '../lib/geolocation'
import { startAlarm, stopAlarm } from '../lib/alarm'
import { sendPush } from '../lib/webPush'

function PagoBadge({ pago }) {
  const t = pago === 'tarjeta'
  return <span style={{ background: t ? '#DBEAFE' : '#DCFCE7', color: t ? '#1E40AF' : '#166534', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{t ? '💳 Tarjeta' : '💵 Efectivo'}</span>
}

function CanalBadge({ canal }) {
  const p = canal === 'pidogo'
  return <span style={{ background: p ? '#DBEAFE' : '#F3E8FF', color: p ? '#1E40AF' : '#6B21A8', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{p ? 'Tu tienda' : 'App PIDO'}</span>
}

function openGoogleMaps(lat, lng, label) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
  window.open(url, '_blank')
}

function callPhone(phone) {
  if (phone) window.open(`tel:${phone}`, '_self')
}

export default function EnVivo() {
  const { socio } = useSocio()
  const [pedidos, setPedidos] = useState([])
  const [pedidoActivo, setPedidoActivo] = useState(null)
  const [items, setItems] = useState([])
  const [etapa, setEtapa] = useState(null)
  const [cliente, setCliente] = useState(null)

  // Tracking de posicion del socio cada 10s
  useEffect(() => {
    if (!socio?.en_servicio) return
    let watchId = null
    let interval = null

    watchPosition(pos => {
      if (!interval) {
        interval = setInterval(() => {
          supabase.from('socios').update({
            latitud_actual: pos.lat,
            longitud_actual: pos.lng,
          }).eq('id', socio.id).then(() => {})
        }, 10000)
      }
    }).then(id => { watchId = id })

    return () => {
      if (watchId) clearWatch(watchId)
      if (interval) clearInterval(interval)
    }
  }, [socio?.en_servicio])

  useEffect(() => {
    if (!socio) return
    fetchPedidos()

    const channel = supabase.channel('pedidos-socio')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'pedidos',
        filter: `socio_id=eq.${socio.id}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setPedidos(prev => [payload.new, ...prev])
          startAlarm()
        } else if (payload.eventType === 'UPDATE') {
          setPedidos(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
          if (pedidoActivo && payload.new.id === pedidoActivo.id) {
            setPedidoActivo(prev => ({ ...prev, ...payload.new }))
          }
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [socio?.id])

  async function fetchPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('*, establecimientos(nombre, direccion, latitud, longitud, telefono)')
      .eq('socio_id', socio.id)
      .in('estado', ['nuevo', 'aceptado', 'preparando', 'listo', 'recogido', 'en_camino'])
      .order('created_at', { ascending: false })
    setPedidos(data || [])
  }

  async function loadCliente(usuarioId) {
    if (!usuarioId) return
    const { data } = await supabase.from('usuarios').select('*').eq('id', usuarioId).single()
    setCliente(data)
  }

  async function aceptarPedido(pedido) {
    stopAlarm()
    await supabase.from('pedidos').update({ estado: 'aceptado', aceptado_at: new Date().toISOString() }).eq('id', pedido.id)
    const { data: pedidoItems } = await supabase.from('pedido_items').select('*').eq('pedido_id', pedido.id)
    setItems(pedidoItems || [])
    await loadCliente(pedido.usuario_id)
    setPedidoActivo({ ...pedido, estado: 'aceptado' })
    setEtapa('ir_recoger')
  }

  async function rechazarPedido(pedido) {
    stopAlarm()
    await supabase.from('pedidos').update({ estado: 'cancelado' }).eq('id', pedido.id)
    setPedidos(prev => prev.filter(p => p.id !== pedido.id))
  }

  async function marcarFallido() {
    await supabase.from('pedidos').update({ estado: 'fallido' }).eq('id', pedidoActivo.id)
    setPedidoActivo(null)
    setEtapa(null)
    setCliente(null)
    fetchPedidos()
  }

  async function avanzarEtapa() {
    const map = {
      ir_recoger: { etapa: 'recogido', estado: 'recogido', field: 'recogido_at' },
      recogido: { etapa: 'ir_entregar', estado: 'en_camino', field: null },
      ir_entregar: { etapa: 'entregado', estado: 'entregado', field: 'entregado_at' },
    }
    const next = map[etapa]
    if (!next) return

    const update = { estado: next.estado }
    if (next.field) update[next.field] = new Date().toISOString()
    await supabase.from('pedidos').update(update).eq('id', pedidoActivo.id)

    if (next.estado === 'entregado') {
      supabase.functions.invoke('calcular_comisiones', { body: { pedido_id: pedidoActivo.id } })
      if (pedidoActivo.usuario_id) sendPush({ targetType: 'cliente', targetId: pedidoActivo.usuario_id, title: 'Pedido entregado', body: `Tu pedido ${pedidoActivo.codigo} ha sido entregado. ¡Buen provecho!` })
    } else if (next.estado === 'en_camino') {
      if (pedidoActivo.usuario_id) sendPush({ targetType: 'cliente', targetId: pedidoActivo.usuario_id, title: 'Pedido en camino', body: `Tu pedido ${pedidoActivo.codigo} va en camino` })
    } else if (next.estado === 'recogido') {
      if (pedidoActivo.usuario_id) sendPush({ targetType: 'cliente', targetId: pedidoActivo.usuario_id, title: 'Pedido recogido', body: `Tu repartidor ha recogido tu pedido ${pedidoActivo.codigo}` })
    }

    setPedidoActivo(prev => ({ ...prev, ...update }))
    setEtapa(next.etapa)
  }

  const etapas = [
    { id: 'ir_recoger', label: 'Ir a recoger' },
    { id: 'recogido', label: 'Pedido recogido' },
    { id: 'ir_entregar', label: 'En camino al cliente' },
    { id: 'entregado', label: 'Entregado' },
  ]
  const etapaIdx = etapa ? etapas.findIndex(e => e.id === etapa) : -1

  // Pedido activo
  if (pedidoActivo) {
    const irAlRestaurante = etapa === 'ir_recoger'
    const irAlCliente = etapa === 'recogido' || etapa === 'ir_entregar'
    const destLat = irAlRestaurante ? pedidoActivo.establecimientos?.latitud : (pedidoActivo.lat_entrega || cliente?.latitud)
    const destLng = irAlRestaurante ? pedidoActivo.establecimientos?.longitud : (pedidoActivo.lng_entrega || cliente?.longitud)
    const destNombre = irAlRestaurante ? pedidoActivo.establecimientos?.nombre : (cliente?.nombre || 'Cliente')
    const destDireccion = irAlRestaurante ? pedidoActivo.establecimientos?.direccion : (pedidoActivo.direccion_entrega || cliente?.direccion || 'Sin direccion')

    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)', margin: '0 0 16px' }}>Pedido activo</h2>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {etapas.map((e, i) => (
            <div key={e.id} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= etapaIdx ? 'var(--c-accent)' : 'var(--c-border)', transition: 'background 0.3s' }} />
          ))}
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-accent)', marginBottom: 4 }}>{etapas[etapaIdx]?.label}</div>

        {/* Info pedido */}
        <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--c-border)', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{pedidoActivo.codigo}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <PagoBadge pago={pedidoActivo.metodo_pago} />
              <CanalBadge canal={pedidoActivo.canal} />
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{pedidoActivo.establecimientos?.nombre}</div>
          {items.map((item, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 2 }}>
              {item.cantidad}x {item.nombre_producto} — {(item.precio_unitario * item.cantidad).toFixed(2)} €
            </div>
          ))}
          {pedidoActivo.notas && (
            <div style={{ fontSize: 12, color: '#92400E', background: '#FEF3C7', borderRadius: 8, padding: '8px 10px', marginTop: 8 }}>{pedidoActivo.notas}</div>
          )}
          <div style={{ fontWeight: 800, fontSize: 15, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--c-border)' }}>
            Total: {pedidoActivo.total?.toFixed(2)} €
            {pedidoActivo.metodo_pago === 'efectivo' && <span style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginLeft: 8 }}>Cobrar en efectivo</span>}
          </div>
        </div>

        {/* Destino con navegacion */}
        {etapa !== 'entregado' && (
          <div style={{
            background: irAlRestaurante ? '#FFF7ED' : '#F0FDF4',
            borderRadius: 14, padding: '16px 18px', marginBottom: 12,
            border: irAlRestaurante ? '1px solid #FED7AA' : '1px solid #BBF7D0',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: irAlRestaurante ? '#C2410C' : '#15803D', marginBottom: 6, textTransform: 'uppercase' }}>
              {irAlRestaurante ? '📍 Ir al restaurante' : '📍 Ir al cliente'}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{destNombre}</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 12 }}>{destDireccion}</div>

            <button onClick={() => openGoogleMaps(destLat, destLng)} style={styles.navBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              Navegar con Google Maps
            </button>
          </div>
        )}

        {/* Contactar cliente */}
        {irAlCliente && etapa !== 'entregado' && (
          <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '14px 18px', marginBottom: 12, border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', marginBottom: 8, textTransform: 'uppercase' }}>👤 Cliente</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{cliente?.nombre || 'Cliente'} {cliente?.apellido || ''}</div>
            {cliente?.telefono && <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 10 }}>{cliente.telefono}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => callPhone(cliente?.telefono)} style={{ ...styles.contactBtn, background: '#16A34A', flex: 1 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                Llamar
              </button>
              <button onClick={() => window.open(`https://wa.me/${(cliente?.telefono || '').replace(/[^0-9]/g, '')}`, '_blank')} style={{ ...styles.contactBtn, background: '#25D366', flex: 1 }}>
                💬 WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Botones de accion */}
        {etapa !== 'entregado' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <button onClick={avanzarEtapa} style={styles.mainBtn}>
              {etapa === 'ir_recoger' && '✅ He recogido el pedido'}
              {etapa === 'recogido' && '🛵 En camino al cliente'}
              {etapa === 'ir_entregar' && '📦 Pedido entregado'}
            </button>
            <button onClick={marcarFallido} style={styles.failBtn}>
              ❌ Pedido fallido
            </button>
          </div>
        ) : (
          <div style={{ background: '#DCFCE7', borderRadius: 14, padding: 20, textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#166534', marginBottom: 4 }}>Pedido entregado</div>
            <div style={{ fontSize: 13, color: '#15803D', marginBottom: 16 }}>
              Ganancia: +{(pedidoActivo.total * 0.1 + (pedidoActivo.coste_envio || 0) + (pedidoActivo.propina || 0)).toFixed(2)} €
            </div>
            <button onClick={() => { setPedidoActivo(null); setEtapa(null); setCliente(null); fetchPedidos() }} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#166534', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Volver</button>
          </div>
        )}
      </div>
    )
  }

  // Lista de pedidos nuevos y en progreso
  const nuevos = pedidos.filter(p => p.estado === 'nuevo')
  const enProgreso = pedidos.filter(p => ['aceptado', 'preparando', 'listo', 'recogido', 'en_camino'].includes(p.estado))

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Pedidos en vivo</h2>
      <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 24 }}>Aqui aparecen los pedidos en tiempo real.</p>

      {/* Pedidos nuevos */}
      {nuevos.map(p => (
        <div key={p.id} style={{ background: 'linear-gradient(135deg, #FF5733, #FF8F73)', borderRadius: 16, padding: 20, marginBottom: 16, animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, opacity: 0.7, marginBottom: 2 }}>NUEVO PEDIDO</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>{p.establecimientos?.nombre}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <PagoBadge pago={p.metodo_pago} />
              <CanalBadge canal={p.canal} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: 14, fontWeight: 800, marginBottom: 16 }}>
            <span>Total: {p.total?.toFixed(2)} €</span>
            <span>Ganancia: +{(p.total * 0.1 + (p.coste_envio || 0) + (p.propina || 0)).toFixed(2)} €</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => rechazarPedido(p)} style={{ flex: 1, padding: '14px 0', borderRadius: 12, border: '2px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rechazar</button>
            <button onClick={() => aceptarPedido(p)} style={{ flex: 2, padding: '14px 0', borderRadius: 12, border: 'none', background: '#fff', color: 'var(--c-accent)', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Aceptar pedido</button>
          </div>
        </div>
      ))}

      {/* Pedidos en progreso - retomar */}
      {enProgreso.map(p => (
        <div key={p.id} style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--c-border)', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{p.codigo}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#FEF3C7', color: '#92400E', textTransform: 'capitalize' }}>{p.estado?.replace('_', ' ')}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 8 }}>{p.establecimientos?.nombre} — {p.total?.toFixed(2)} €</div>
          <button onClick={async () => {
            const { data: pedidoItems } = await supabase.from('pedido_items').select('*').eq('pedido_id', p.id)
            setItems(pedidoItems || [])
            await loadCliente(p.usuario_id)
            setPedidoActivo(p)
            const estadoMap = { aceptado: 'ir_recoger', preparando: 'ir_recoger', listo: 'ir_recoger', recogido: 'recogido', en_camino: 'ir_entregar' }
            setEtapa(estadoMap[p.estado] || 'ir_recoger')
          }} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', background: 'var(--c-accent)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Continuar pedido
          </button>
        </div>
      ))}

      {nuevos.length === 0 && enProgreso.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: 13, padding: '40px 0' }}>Esperando nuevos pedidos...</div>
      )}
    </div>
  )
}

const styles = {
  navBtn: {
    width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
    background: '#1A73E8', color: '#fff', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  contactBtn: {
    padding: '10px 0', borderRadius: 10, border: 'none', color: '#fff',
    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  mainBtn: {
    width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
    background: 'var(--c-accent)', color: '#fff', fontSize: 16, fontWeight: 800,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
  failBtn: {
    width: '100%', padding: '12px 0', borderRadius: 12, border: '1px solid #FCA5A5',
    background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
}
