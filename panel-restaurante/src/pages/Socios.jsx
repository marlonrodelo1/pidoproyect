import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRest } from '../context/RestContext'

export default function Socios() {
  const { restaurante } = useRest()
  const [relaciones, setRelaciones] = useState([])
  const [detalle, setDetalle] = useState(null)
  const [tab, setTab] = useState('info')
  const [facturas, setFacturas] = useState([])
  const [mensajes, setMensajes] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (restaurante) fetchSocios() }, [restaurante?.id])

  async function fetchSocios() {
    setLoading(true)
    // Mostrar activos/pendientes + rechazados de los últimos 30 días
    const hace30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('socio_establecimiento')
      .select('*, socios(id, nombre, nombre_comercial, email, telefono, rating, total_resenas, logo_url, tarifa_base, radio_tarifa_base_km, precio_km_adicional)')
      .eq('establecimiento_id', restaurante.id)
      .or(`estado.neq.rechazado,solicitado_at.gte.${hace30d}`)
    setRelaciones(data || [])
    setLoading(false)
  }

  async function cambiarEstado(relId, estado) {
    const update = { estado }
    if (estado === 'aceptado') update.aceptado_at = new Date().toISOString()
    await supabase.from('socio_establecimiento').update(update).eq('id', relId)
    fetchSocios()
    setDetalle(null)
  }

  const chatScrollRef = useRef()

  async function abrirDetalle(rel) {
    setDetalle(rel)
    setTab('info')
    // Cargar facturas
    const { data: facts } = await supabase.from('facturas_semanales')
      .select('*').eq('socio_id', rel.socios.id).eq('establecimiento_id', restaurante.id)
      .order('semana_inicio', { ascending: false }).limit(10)
    setFacturas(facts || [])
    // Cargar mensajes
    const { data: msgs } = await supabase.from('mensajes')
      .select('*').eq('tipo', 'socio_restaurante').eq('socio_id', rel.socios.id).eq('establecimiento_id', restaurante.id)
      .order('created_at', { ascending: true }).limit(50)
    setMensajes(msgs || [])
  }

  // Realtime chat: escuchar nuevos mensajes del socio activo
  useEffect(() => {
    if (!detalle || tab !== 'chat') return
    const socioId = detalle.socios.id
    const channel = supabase.channel(`chat-rest-${socioId}-${restaurante.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes',
        filter: `establecimiento_id=eq.${restaurante.id}`,
      }, payload => {
        if (payload.new.socio_id === socioId) {
          setMensajes(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [detalle?.socios?.id, tab])

  // Auto-scroll al fondo en chat
  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
  }, [mensajes.length])

  async function enviarMensaje() {
    if (!msgInput.trim() || !detalle) return
    const texto = msgInput.trim()
    setMsgInput('')
    const { data } = await supabase.from('mensajes').insert({
      tipo: 'socio_restaurante', socio_id: detalle.socios.id,
      establecimiento_id: restaurante.id, de: 'restaurante', texto,
    }).select().single()
    if (data) {
      setMensajes(prev => {
        if (prev.some(m => m.id === data.id)) return prev
        return [...prev, data]
      })
    }
  }

  const pendientes = relaciones.filter(r => r.estado === 'pendiente')
  const aceptados = relaciones.filter(r => r.estado === 'aceptado')
  const rechazados = relaciones.filter(r => r.estado === 'rechazado')

  // Detalle del socio
  if (detalle) {
    const s = detalle.socios
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <button onClick={() => setDetalle(null)} style={{ background: 'none', border: 'none', color: 'var(--c-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0, fontFamily: 'inherit' }}>← Volver</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, overflow: 'hidden' }}>
            {s.logo_url ? <img src={s.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🛵'}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{s.nombre_comercial || s.nombre}</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>★ {s.rating} · {s.total_resenas} reseñas</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--c-surface2)', borderRadius: 10, padding: 3, marginBottom: 20 }}>
          {['info', 'facturas', 'chat'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: tab === t ? 'var(--c-primary)' : 'transparent', color: tab === t ? '#fff' : 'var(--c-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>

        {tab === 'info' && (
          <>
            <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 12 }}>
              {[{ l: 'Nombre', v: s.nombre }, { l: 'Email', v: s.email }, { l: 'Teléfono', v: s.telefono }, { l: 'Rating', v: `★ ${s.rating}` }, { l: 'Tarifa base', v: `${s.tarifa_base || 3} €` }, { l: 'Radio tarifa', v: `${s.radio_tarifa_base_km || 3} km` }, { l: 'Precio/km extra', v: `${s.precio_km_adicional || 0.5} €/km` }].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 6 ? '1px solid var(--c-border)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>{item.l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{item.v || '—'}</span>
                </div>
              ))}
            </div>
            <button onClick={async () => {
              if (!confirm('¿Desvincular a este socio? Dejará de repartir para tu restaurante.')) return
              await supabase.from('socio_establecimiento').delete().eq('id', detalle.id)
              setDetalle(null)
              fetchSocios()
            }} style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Desvincular socio
            </button>
          </>
        )}

        {tab === 'facturas' && (
          <div>
            {facturas.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-muted)', fontSize: 13 }}>Sin facturas</div>}
            {facturas.map((f, i) => (
              <div key={i} style={{ background: 'var(--c-surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--c-border)', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{f.semana_inicio} — {f.semana_fin}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: f.estado === 'pagado' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: f.estado === 'pagado' ? '#4ADE80' : '#FBBF24' }}>{f.estado === 'pagado' ? 'Pagado' : 'Pendiente'}</span>
                </div>
                {f.numero_factura && <div style={{ fontSize: 10, color: 'var(--c-primary)', fontWeight: 700, marginBottom: 6 }}>{f.numero_factura}</div>}
                <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.6 }}>
                  {f.pedidos_entregados} entregados · Ventas: {f.total_ventas?.toFixed(2)} € · Comisión: {f.total_comisiones?.toFixed(2)} € · Envíos: {f.total_envios?.toFixed(2)} €
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#16A34A' }}>{f.total_ganado?.toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'chat' && (
          <div>
            <div ref={chatScrollRef} style={{ minHeight: 200, maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {mensajes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-muted)' }}>
                  <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>💬</span>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Sin mensajes</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Los mensajes se borran cada semana</div>
                </div>
              )}
              {mensajes.map(m => (
                <div key={m.id || m.created_at} style={{ alignSelf: m.de === 'restaurante' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{
                    background: m.de === 'restaurante' ? 'var(--c-primary)' : 'var(--c-surface)',
                    color: m.de === 'restaurante' ? '#fff' : 'var(--c-text)',
                    borderRadius: m.de === 'restaurante' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '10px 14px', fontSize: 13,
                    border: m.de !== 'restaurante' ? '1px solid var(--c-border)' : 'none',
                  }}>{m.texto}</div>
                  <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 3, textAlign: m.de === 'restaurante' ? 'right' : 'left' }}>
                    {new Date(m.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviarMensaje()} placeholder="Escribe un mensaje..." style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--c-border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--c-surface)', color: 'var(--c-text)', outline: 'none' }} />
              <button onClick={enviarMensaje} disabled={!msgInput.trim()} style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: msgInput.trim() ? 'var(--c-primary)' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: msgInput.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>Socios repartidores</h2>

      {loading && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-muted)' }}>Cargando...</div>}

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #FDE68A' }}>
            <span style={{ fontSize: 16 }}>⏳</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>{pendientes.length} solicitud{pendientes.length > 1 ? 'es' : ''} pendiente{pendientes.length > 1 ? 's' : ''}</span>
          </div>
          {pendientes.map(r => (
            <div key={r.id} style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '16px', border: '2px solid #FDE68A', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{r.socios?.nombre_comercial || r.socios?.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 12 }}>★ {r.socios?.rating} · Quiere repartir para ti</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => cambiarEstado(r.id, 'aceptado')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Aceptar</button>
                <button onClick={() => cambiarEstado(r.id, 'rechazado')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--c-border)', background: 'var(--c-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#991B1B' }}>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aceptados */}
      {aceptados.length > 0 && <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Socios activos</h3>}
      {aceptados.map(r => (
        <div key={r.id} onClick={() => abrirDetalle(r)} style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--c-border)', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛵</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{r.socios?.nombre_comercial || r.socios?.nombre}</div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>★ {r.socios?.rating}</div>
          </div>
          <span style={{ color: 'var(--c-muted)', fontSize: 16 }}>›</span>
        </div>
      ))}

      {/* Rechazados */}
      {rechazados.length > 0 && <h3 style={{ fontSize: 16, fontWeight: 800, margin: '24px 0 12px' }}>Rechazados</h3>}
      {rechazados.map(r => (
        <div key={r.id} style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--c-border)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.6 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{r.socios?.nombre_comercial || r.socios?.nombre}</span>
          <button onClick={() => cambiarEstado(r.id, 'aceptado')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--c-surface2)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--c-primary)' }}>Reactivar</button>
        </div>
      ))}
    </div>
  )
}
