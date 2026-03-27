import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useSocio } from '../context/SocioContext'

export default function Soporte() {
  const { socio } = useSocio()
  const [mensajes, setMensajes] = useState([])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    if (!socio) return
    fetchMensajes()

    const channel = supabase.channel('soporte-socio')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes',
        filter: `socio_id=eq.${socio.id}`,
      }, payload => {
        if (payload.new.tipo === 'soporte') {
          setMensajes(prev => [...prev, payload.new])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [socio?.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function fetchMensajes() {
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .eq('socio_id', socio.id)
      .eq('tipo', 'soporte')
      .order('created_at', { ascending: true })
      .limit(100)
    setMensajes(data || [])
  }

  async function enviar() {
    if (!input.trim()) return
    const texto = input.trim()
    setInput('')
    await supabase.from('mensajes').insert({
      tipo: 'soporte',
      socio_id: socio.id,
      de: 'socio',
      texto,
    })
  }

  function formatHora(fecha) {
    return new Date(fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>Soporte PIDO</h2>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {mensajes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-muted)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 13 }}>Escribe tu mensaje para contactar con soporte</div>
          </div>
        )}
        {mensajes.map((m, i) => (
          <div key={i} style={{ alignSelf: m.de === 'socio' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <div style={{
              background: m.de === 'socio' ? 'var(--c-accent)' : 'var(--c-surface)',
              color: m.de === 'socio' ? '#fff' : 'var(--c-text)',
              borderRadius: 14,
              borderBottomRightRadius: m.de === 'socio' ? 4 : 14,
              borderBottomLeftRadius: m.de === 'soporte' ? 4 : 14,
              padding: '10px 14px', fontSize: 13, lineHeight: 1.5,
              border: m.de === 'soporte' ? '1px solid var(--c-border)' : 'none',
            }}>{m.texto}</div>
            <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 4, textAlign: m.de === 'socio' ? 'right' : 'left' }}>
              {formatHora(m.created_at)}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Escribe tu mensaje..."
          style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--c-border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--c-surface)', color: 'var(--c-text)', outline: 'none' }} />
        <button onClick={enviar} style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: 'var(--c-accent)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  )
}
