import { useState, useEffect } from 'react'
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
