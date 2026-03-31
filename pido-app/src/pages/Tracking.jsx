import { useState, useEffect } from 'react'
import { Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'

const ETAPAS = [
  { label: 'Pendiente', desc: 'Esperando que el restaurante acepte', icon: '⏳', estado: 'nuevo' },
  { label: 'Aceptado', desc: 'El restaurante esta preparando tu pedido', icon: '👨‍🍳', estado: 'preparando' },
  { label: 'Recogido', desc: 'El repartidor ha recogido tu pedido', icon: '📦', estado: 'recogido' },
  { label: 'En camino', desc: 'Tu pedido esta en camino', icon: '🛵', estado: 'en_camino' },
  { label: 'Entregado', desc: 'Tu pedido ha llegado', icon: '✅', estado: 'entregado' },
]

// listo queda en etapa 1 (igual que preparando) — solo el socio avanza el tracking del cliente
function getEtapa(estado) {
  const map = { nuevo: 0, aceptado: 1, preparando: 1, listo: 1, recogido: 2, en_camino: 3, entregado: 4 }
  return map[estado] ?? 0
}

export default function Tracking({ pedido: pedidoInicial, onClose }) {
  const [pedido, setPedido] = useState(pedidoInicial)
  const [etapa, setEtapa] = useState(getEtapa(pedidoInicial.estado))
  const [riderPos, setRiderPos] = useState(0)
  const [socio, setSocio] = useState(null)
  const [valoracion, setValoracion] = useState(0)
  const [textoResena, setTextoResena] = useState('')
  const [resenaEnviada, setResenaEnviada] = useState(false)
  const [yaValorado, setYaValorado] = useState(false)

  // Fetch estado actual al montar
  useEffect(() => {
    supabase.from('pedidos').select('*').eq('id', pedidoInicial.id).single()
      .then(({ data }) => {
        if (data) {
          setPedido(data)
          setEtapa(getEtapa(data.estado))
        }
      })
  }, [pedidoInicial.id])

  // Fetch socio
  useEffect(() => {
    if (pedido.socio_id) {
      supabase.from('socios').select('nombre, rating, telefono').eq('id', pedido.socio_id).single()
        .then(({ data }) => { if (data) setSocio(data) })
    }
  }, [pedido.socio_id])

  // Comprobar si ya valoro
  useEffect(() => {
    if (pedido.id && pedido.usuario_id) {
      supabase.from('resenas').select('id').eq('pedido_id', pedido.id).eq('usuario_id', pedido.usuario_id).single()
        .then(({ data }) => { if (data) setYaValorado(true) })
    }
  }, [pedido.id])

  // Realtime + polling
  useEffect(() => {
    const channel = supabase.channel(`tracking-${pedido.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'pedidos',
        filter: `id=eq.${pedido.id}`,
      }, payload => {
        const nuevo = payload.new
        setPedido(prev => ({ ...prev, ...nuevo }))
        if (nuevo.estado !== 'cancelado' && nuevo.estado !== 'fallido') {
          setEtapa(getEtapa(nuevo.estado))
        }
      })
      .subscribe()

    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('estado, socio_id, motivo_cancelacion, metodo_pago')
        .eq('id', pedido.id)
        .single()
      if (data) {
        setPedido(prev => ({ ...prev, ...data }))
        if (data.estado !== 'cancelado' && data.estado !== 'fallido') {
          const nuevaEtapa = getEtapa(data.estado)
          if (nuevaEtapa !== etapa) setEtapa(nuevaEtapa)
        }
        if (data.socio_id && !socio) {
          supabase.from('socios').select('nombre, rating, telefono').eq('id', data.socio_id).single()
            .then(({ data: s }) => { if (s) setSocio(s) })
        }
      }
    }, 4000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [pedido.id, etapa])

  // Animacion del rider
  useEffect(() => {
    if (etapa === 3) {
      const i = setInterval(() => setRiderPos(p => Math.min(p + 2, 100)), 200)
      return () => clearInterval(i)
    }
  }, [etapa])

  async function enviarValoracion() {
    if (!valoracion || yaValorado || resenaEnviada) return
    const { error } = await supabase.from('resenas').insert({
      usuario_id: pedido.usuario_id,
      establecimiento_id: pedido.establecimiento_id,
      socio_id: pedido.socio_id,
      pedido_id: pedido.id,
      rating: valoracion,
      texto: textoResena.trim() || null,
    })
    if (!error) {
      setResenaEnviada(true)
      setYaValorado(true)
      // Cerrar y volver a inicio después de enviar reseña
      setTimeout(() => onClose(), 1500)
    }
  }

  // ==================== CANCELADO ====================
  if (pedido.estado === 'cancelado' || pedido.estado === 'fallido') {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)', margin: 0 }}>Tu pedido</h2>
          <span style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>{pedido.codigo}</span>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 16, padding: 28, textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>😔</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#EF4444', marginBottom: 8 }}>Pedido cancelado</div>
          {pedido.motivo_cancelacion && (
            <div style={{
              fontSize: 14, color: 'var(--c-text)', marginBottom: 12, fontWeight: 600,
              background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '10px 14px',
            }}>{pedido.motivo_cancelacion}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 20 }}>
            {pedido.metodo_pago === 'tarjeta' ? 'Si se realizo el cobro, el reembolso se procesara automaticamente.' : 'No se ha realizado ningun cobro.'}
          </div>
          <button onClick={onClose} style={{
            padding: '12px 28px', borderRadius: 12, border: 'none',
            background: 'var(--c-primary)', color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Entendido</button>
        </div>
      </div>
    )
  }

  // ==================== TRACKING ACTIVO ====================
  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)', margin: 0 }}>Tu pedido</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>{pedido.codigo}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: 'var(--c-primary)', cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar</button>
        </div>
      </div>

      {/* Mapa animado */}
      <div style={{ height: 180, borderRadius: 16, background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '10%', width: '80%', height: 3, background: 'rgba(0,0,0,0.1)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: 30, left: '12%', fontSize: 24 }}>🏪</div>
        <div style={{ position: 'absolute', top: 30, right: '12%', fontSize: 24 }}>🏠</div>
        {etapa >= 3 && (
          <div style={{ position: 'absolute', top: '42%', left: `${10 + riderPos * 0.8}%`, fontSize: 28, transition: 'left 0.2s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🛵</div>
        )}
        {etapa < 3 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#166534', background: 'rgba(255,255,255,0.8)',
              padding: '6px 14px', borderRadius: 8,
              animation: etapa === 0 ? 'pulse 2s ease-in-out infinite' : 'none',
            }}>
              {etapa === 0 ? '⏳ Esperando al restaurante...' : etapa === 1 ? '👨‍🍳 Preparando tu pedido...' : '📦 Repartidor recogiendo...'}
            </div>
          </div>
        )}
        {etapa === 4 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.15)' }}>
            <div style={{ fontSize: 40 }}>✅</div>
          </div>
        ) : (
          <div style={{ position: 'absolute', bottom: 10, left: 12, background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600 }}>
            {etapa === 0 ? 'Pendiente de aceptar' : `Estimado: ${Math.max(5, 25 - etapa * 5)} min`}
          </div>
        )}
      </div>

      {/* Info repartidor */}
      {socio && etapa >= 1 && etapa < 5 && (
        <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--c-border)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--c-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛵</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>{socio.nombre}</div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>★ {socio.rating} · Tu repartidor</div>
          </div>
          {socio.telefono && (
            <button onClick={() => window.open(`tel:${socio.telefono}`, '_self')} style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--c-primary-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={16} strokeWidth={2} color="var(--c-primary)" />
            </button>
          )}
        </div>
      )}

      {/* Pasos */}
      <div style={{ marginBottom: 20 }}>
        {ETAPAS.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: i <= etapa ? 'var(--c-primary)' : 'var(--c-surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, transition: 'all 0.3s',
                animation: i === 0 && etapa === 0 ? 'pulse 2s ease-in-out infinite' : 'none',
              }}>
                {i <= etapa ? e.icon : ''}
              </div>
              {i < 4 && <div style={{ width: 2, height: 24, background: i < etapa ? 'var(--c-primary)' : 'var(--c-border)' }} />}
            </div>
            <div style={{ paddingTop: 4, paddingBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: i <= etapa ? 'var(--c-text)' : 'var(--c-muted)' }}>{e.label}</div>
              <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{e.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Valoracion al entregar */}
      {etapa === 4 && (
        <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--c-border)' }}>
          {yaValorado || resenaEnviada ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-primary)' }}>Gracias por tu valoracion</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>Tu opinion nos ayuda a mejorar</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 10, textAlign: 'center' }}>¿Como fue tu experiencia?</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} onClick={() => setValoracion(i)} style={{
                    width: 40, height: 40, borderRadius: 10,
                    border: i <= valoracion ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
                    background: i <= valoracion ? 'var(--c-primary)' : 'var(--c-surface)',
                    cursor: 'pointer', fontSize: 18,
                    color: i <= valoracion ? '#fff' : 'var(--c-text)',
                    transition: 'all 0.15s',
                  }}>★</button>
                ))}
              </div>
              {valoracion > 0 && (
                <>
                  <textarea value={textoResena} onChange={e => setTextoResena(e.target.value)} placeholder="Cuentanos mas sobre tu experiencia (opcional)..." rows={3} style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--c-border)',
                    fontSize: 13, fontFamily: 'inherit', background: 'rgba(255,255,255,0.06)',
                    color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box', resize: 'vertical', marginBottom: 12,
                  }} />
                  <button onClick={enviarValoracion} style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    background: 'var(--c-primary)', color: '#fff', fontSize: 14, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    Enviar valoracion
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Badge metodo pago */}
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--c-muted)' }}>
        {pedido.metodo_pago === 'tarjeta' ? '💳 Pagado con tarjeta' : '💵 Pago en efectivo'}
      </div>
    </div>
  )
}
