import { useState, useEffect } from 'react'
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
    const { data } = await supabase
      .from('socio_establecimiento')
      .select('*, socios(id, nombre, nombre_comercial, email, telefono, rating, total_resenas, logo_url)')
      .eq('establecimiento_id', restaurante.id)
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

  async function enviarMensaje() {
    if (!msgInput.trim() || !detalle) return
    await supabase.from('mensajes').insert({
      tipo: 'socio_restaurante', socio_id: detalle.socios.id,
      establecimiento_id: restaurante.id, de: 'restaurante', texto: msgInput.trim(),
    })
    setMensajes(prev => [...prev, { de: 'restaurante', texto: msgInput.trim(), created_at: new Date().toISOString() }])
    setMsgInput('')
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
          <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)' }}>
            {[{ l: 'Nombre', v: s.nombre }, { l: 'Email', v: s.email }, { l: 'Teléfono', v: s.telefono }, { l: 'Rating', v: `★ ${s.rating}` }].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--c-border)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>{item.l}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{item.v || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'facturas' && (
          <div>
            {facturas.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-muted)', fontSize: 13 }}>Sin facturas</div>}
            {facturas.map((f, i) => (
              <div key={i} style={{ background: 'var(--c-surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--c-border)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{f.semana_inicio} — {f.semana_fin}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{f.pedidos_entregados} pedidos · {f.total_ventas.toFixed(2)} € ventas</div>
                </div>
                <span style={{ background: f.estado === 'pagado' ? '#DCFCE7' : '#FEF3C7', color: f.estado === 'pagado' ? '#166534' : '#92400E', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize' }}>{f.estado}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'chat' && (
          <div>
            <div style={{ minHeight: 200, maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {mensajes.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-muted)', fontSize: 13 }}>Sin mensajes</div>}
              {mensajes.map((m, i) => (
                <div key={i} style={{ alignSelf: m.de === 'restaurante' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ background: m.de === 'restaurante' ? 'var(--c-primary)' : 'var(--c-surface)', color: m.de === 'restaurante' ? '#fff' : 'var(--c-text)', borderRadius: 14, padding: '10px 14px', fontSize: 13, border: m.de !== 'restaurante' ? '1px solid var(--c-border)' : 'none' }}>{m.texto}</div>
                  <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 4, textAlign: m.de === 'restaurante' ? 'right' : 'left' }}>
                    {new Date(m.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviarMensaje()} placeholder="Escribe..." style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--c-border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--c-surface)', color: 'var(--c-text)', outline: 'none' }} />
              <button onClick={enviarMensaje} style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: 'var(--c-primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
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
