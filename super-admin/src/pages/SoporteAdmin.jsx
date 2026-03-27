import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SoporteAdmin() {
  const [conversaciones, setConversaciones] = useState([])
  const [selected, setSelected] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')

  useEffect(() => { loadConversaciones() }, [])

  async function loadConversaciones() {
    const { data } = await supabase.from('mensajes')
      .select('socio_id, texto, created_at, leido')
      .eq('tipo', 'soporte')
      .order('created_at', { ascending: false })

    const agrupados = {}
    ;(data || []).forEach(m => {
      if (!agrupados[m.socio_id]) agrupados[m.socio_id] = { socio_id: m.socio_id, ultimo: m.texto, fecha: m.created_at, sinLeer: 0 }
      if (!m.leido) agrupados[m.socio_id].sinLeer++
    })
    const lista = Object.values(agrupados).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    // Cargar nombres de socios
    const ids = lista.map(c => c.socio_id).filter(Boolean)
    if (ids.length > 0) {
      const { data: socios } = await supabase.from('socios').select('id, nombre, nombre_comercial').in('id', ids)
      const map = {}
      ;(socios || []).forEach(s => { map[s.id] = s })
      lista.forEach(c => { c.socio = map[c.socio_id] })
    }
    setConversaciones(lista)
  }

  async function selectConv(conv) {
    setSelected(conv)
    const { data } = await supabase.from('mensajes')
      .select('*')
      .eq('tipo', 'soporte')
      .eq('socio_id', conv.socio_id)
      .order('created_at', { ascending: true })
    setMensajes(data || [])
    await supabase.from('mensajes').update({ leido: true }).eq('tipo', 'soporte').eq('socio_id', conv.socio_id).eq('de', 'socio')
    loadConversaciones()
  }

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim() || !selected) return
    await supabase.from('mensajes').insert({
      tipo: 'soporte', socio_id: selected.socio_id, de: 'soporte', texto: texto.trim(),
    })
    setTexto('')
    selectConv(selected)
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Soporte</h1>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)' }}>
        {/* Lista conversaciones */}
        <div style={styles.lista}>
          {conversaciones.map(c => (
            <button key={c.socio_id} onClick={() => selectConv(c)} style={{
              ...styles.convItem,
              background: selected?.socio_id === c.socio_id ? '#FFF3ED' : 'transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{c.socio?.nombre_comercial || 'Socio'}</span>
                {c.sinLeer > 0 && <span style={styles.unread}>{c.sinLeer}</span>}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.ultimo}</div>
              <div style={{ fontSize: 10, color: '#D1D5DB', marginTop: 2 }}>{new Date(c.fecha).toLocaleString('es-ES')}</div>
            </button>
          ))}
          {conversaciones.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin conversaciones</div>}
        </div>

        {/* Chat */}
        <div style={styles.chat}>
          {selected ? (
            <>
              <div style={styles.chatHeader}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{selected.socio?.nombre || 'Socio'}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{selected.socio?.nombre_comercial}</span>
              </div>
              <div style={styles.chatMessages}>
                {mensajes.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.de === 'soporte' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: 14, fontSize: 13,
                      background: m.de === 'soporte' ? '#FF6B2C' : '#F3F4F6',
                      color: m.de === 'soporte' ? '#fff' : '#111827',
                      borderBottomRightRadius: m.de === 'soporte' ? 4 : 14,
                      borderBottomLeftRadius: m.de === 'soporte' ? 14 : 4,
                    }}>
                      {m.texto}
                      <div style={{ fontSize: 9, marginTop: 4, opacity: 0.6 }}>{new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={enviar} style={styles.chatInput}>
                <input
                  value={texto} onChange={e => setTexto(e.target.value)}
                  placeholder="Escribe un mensaje..." style={styles.input}
                />
                <button type="submit" style={styles.sendBtn}>Enviar</button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: 14 }}>
              Selecciona una conversacion
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  lista: { width: 300, background: '#fff', borderRadius: 14, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  convItem: { width: '100%', padding: '14px 16px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left', borderBottom: '1px solid #F9FAFB', display: 'block' },
  unread: { width: 18, height: 18, borderRadius: 9, background: '#FF6B2C', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chat: { flex: 1, background: '#fff', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  chatHeader: { padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10 },
  chatMessages: { flex: 1, padding: 20, overflow: 'auto' },
  chatInput: { padding: '12px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8 },
  input: { flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' },
  sendBtn: { padding: '10px 20px', borderRadius: 10, border: 'none', background: '#FF6B2C', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
}
