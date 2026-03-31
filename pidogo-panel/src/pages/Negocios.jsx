import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useSocio } from '../context/SocioContext'

function EstadoBadge({ estado }) {
  const c = { aceptado: { bg: 'rgba(74,222,128,0.12)', c: '#4ADE80', l: 'Aceptado' }, pendiente: { bg: 'rgba(251,191,36,0.12)', c: '#FBBF24', l: 'Pendiente' }, rechazado: { bg: 'rgba(239,68,68,0.12)', c: '#EF4444', l: 'Rechazado' } }[estado] || { bg: 'rgba(255,255,255,0.06)', c: 'rgba(255,255,255,0.4)', l: 'Nuevo' }
  return <span style={{ background: c.bg, color: c.c, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>{c.l}</span>
}

export default function Negocios() {
  const { socio } = useSocio()
  const [relaciones, setRelaciones] = useState([])
  const [todosEst, setTodosEst] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(null) // relación abierta para chat

  useEffect(() => { if (socio) fetchData() }, [socio?.id])

  async function fetchData() {
    setLoading(true)
    const [relRes, estRes] = await Promise.all([
      supabase.from('socio_establecimiento').select('*, establecimientos(id, nombre, logo_url, tipo)').eq('socio_id', socio.id),
      supabase.from('establecimientos').select('id, nombre, logo_url, tipo').eq('activo', true),
    ])
    setRelaciones(relRes.data || [])
    setTodosEst(estRes.data || [])
    setLoading(false)
  }

  async function solicitar(estId) {
    await supabase.from('socio_establecimiento').insert({ socio_id: socio.id, establecimiento_id: estId, estado: 'pendiente' })
    fetchData()
  }

  async function desvincular(relId) {
    if (!confirm('¿Desvincularte de este establecimiento? Dejarás de recibir pedidos de delivery.')) return
    await supabase.from('socio_establecimiento').delete().eq('id', relId)
    fetchData()
  }

  async function toggleDestacado(rel) {
    await supabase.from('socio_establecimiento').update({ destacado: !rel.destacado }).eq('id', rel.id)
    fetchData()
  }

  const vinculadosIds = relaciones.map(r => r.establecimiento_id)
  const disponibles = todosEst.filter(e => !vinculadosIds.includes(e.id))

  // Vista de chat
  if (chatOpen) {
    return <ChatView rel={chatOpen} socio={socio} onBack={() => setChatOpen(null)} />
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Establecimientos</h2>
      <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 20 }}>Gestiona los establecimientos a los que repartes.</p>

      {loading && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-muted)' }}>Cargando...</div>}

      {/* Relaciones existentes */}
      {relaciones.map(r => (
        <div key={r.id} style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--c-border)', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
              {r.establecimientos?.logo_url ? <img src={r.establecimientos.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{r.establecimientos?.nombre}</span>
              <EstadoBadge estado={r.estado} />
            </div>
          </div>
          {r.estado === 'aceptado' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleDestacado(r)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--c-border)', background: r.destacado ? 'var(--c-accent)' : 'var(--c-surface)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: r.destacado ? '#fff' : 'var(--c-text)' }}>
                {r.destacado ? '★ Destacado' : 'Destacar'}
              </button>
              <button onClick={() => setChatOpen(r)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,107,44,0.3)', background: 'rgba(255,107,44,0.08)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#FF6B2C' }}>
                💬 Chat
              </button>
              <button onClick={() => desvincular(r.id)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.1)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#EF4444' }}>Desvincular</button>
            </div>
          )}
          {r.estado === 'pendiente' && <span style={{ fontSize: 12, color: '#FBBF24', fontWeight: 600 }}>Esperando aprobación...</span>}
        </div>
      ))}

      {/* Disponibles */}
      {disponibles.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '24px 0 14px' }}>Disponibles para solicitar</h3>
          {disponibles.map(e => (
            <div key={e.id} style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--c-border)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {e.logo_url ? <img src={e.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }} /> : '🍽️'}
                </div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{e.nombre}</span>
              </div>
              <button onClick={() => solicitar(e.id)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'var(--c-accent)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Solicitar</button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ==================== CHAT VIEW ====================

function ChatView({ rel, socio, onBack }) {
  const [mensajes, setMensajes] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef()
  const estId = rel.establecimiento_id

  useEffect(() => {
    fetchMensajes()

    // Realtime: escuchar nuevos mensajes
    const channel = supabase.channel(`chat-${socio.id}-${estId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes',
        filter: `socio_id=eq.${socio.id}`,
      }, payload => {
        if (payload.new.establecimiento_id === estId) {
          setMensajes(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [socio.id, estId])

  // Auto-scroll al fondo cuando llegan mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [mensajes.length])

  async function fetchMensajes() {
    const { data } = await supabase.from('mensajes')
      .select('*')
      .eq('tipo', 'socio_restaurante')
      .eq('socio_id', socio.id)
      .eq('establecimiento_id', estId)
      .order('created_at', { ascending: true })
      .limit(50)
    setMensajes(data || [])
    setLoading(false)
  }

  async function enviarMensaje() {
    if (!msgInput.trim()) return
    const texto = msgInput.trim()
    setMsgInput('')
    const { data } = await supabase.from('mensajes').insert({
      tipo: 'socio_restaurante',
      socio_id: socio.id,
      establecimiento_id: estId,
      de: 'socio',
      texto,
    }).select().single()
    if (data) {
      setMensajes(prev => {
        if (prev.some(m => m.id === data.id)) return prev
        return [...prev, data]
      })
    }
  }

  function formatHora(fecha) {
    const d = new Date(fecha)
    const hoy = new Date()
    if (d.toDateString() === hoy.toDateString()) {
      return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--c-accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>←</button>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden', flexShrink: 0 }}>
          {rel.establecimientos?.logo_url ? <img src={rel.establecimientos.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{rel.establecimientos?.nombre}</div>
          <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>Chat directo</div>
        </div>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, paddingRight: 4 }}>
        {loading && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-muted)', fontSize: 13 }}>Cargando...</div>}
        {!loading && mensajes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-muted)' }}>
            <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>💬</span>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Sin mensajes</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Escribe el primer mensaje</div>
          </div>
        )}
        {mensajes.map(m => (
          <div key={m.id} style={{ alignSelf: m.de === 'socio' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <div style={{
              background: m.de === 'socio' ? 'var(--c-accent)' : 'var(--c-surface)',
              color: m.de === 'socio' ? '#fff' : 'var(--c-text)',
              borderRadius: m.de === 'socio' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              padding: '10px 14px', fontSize: 13,
              border: m.de !== 'socio' ? '1px solid var(--c-border)' : 'none',
            }}>{m.texto}</div>
            <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 3, textAlign: m.de === 'socio' ? 'right' : 'left' }}>
              {formatHora(m.created_at)}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={msgInput}
          onChange={e => setMsgInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviarMensaje()}
          placeholder="Escribe un mensaje..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 12,
            border: '1px solid var(--c-border)', fontSize: 13, fontFamily: 'inherit',
            background: 'var(--c-surface)', color: 'var(--c-text)', outline: 'none',
          }}
        />
        <button onClick={enviarMensaje} disabled={!msgInput.trim()} style={{
          width: 44, height: 44, borderRadius: 12, border: 'none',
          background: msgInput.trim() ? 'var(--c-accent)' : 'rgba(255,255,255,0.1)',
          color: '#fff', cursor: msgInput.trim() ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          transition: 'background 0.2s',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  )
}
