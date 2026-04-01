import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRest } from '../context/RestContext'

const LIMIT = 50

export default function Historial() {
  const { restaurante } = useRest()
  const [pedidos, setPedidos] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hayMas, setHayMas] = useState(false)
  const [cargandoMas, setCargandoMas] = useState(false)

  useEffect(() => { if (restaurante) fetchPedidos(true) }, [restaurante?.id, filtro])

  async function fetchPedidos(reset = false) {
    if (reset) setLoading(true)
    setError(null)
    const hace90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const offset = reset ? 0 : pedidos.length

    try {
      const { data, error: queryError } = await supabase.from('pedidos')
        .select('*, socios(nombre)')
        .eq('establecimiento_id', restaurante.id)
        .in('estado', filtro === 'todos' ? ['entregado', 'cancelado', 'fallido'] : [filtro])
        .gte('created_at', hace90d)
        .order('created_at', { ascending: false })
        .range(offset, offset + LIMIT - 1)

      if (queryError) throw queryError
      const items = data || []
      if (reset) setPedidos(items)
      else setPedidos(prev => [...prev, ...items])
      setHayMas(items.length === LIMIT)
    } catch (err) {
      console.error('[Historial] Error:', err)
      setError('Error al cargar el historial. Toca para reintentar.')
    }
    setLoading(false)
    setCargandoMas(false)
  }

  function cargarMas() {
    setCargandoMas(true)
    fetchPedidos(false)
  }

  const colors = { entregado: { bg: '#DCFCE7', c: '#166534' }, cancelado: { bg: '#FEE2E2', c: '#991B1B' }, fallido: { bg: '#FEF3C7', c: '#92400E' } }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>Historial</h2>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20 }}>
        {['todos', 'entregado', 'cancelado', 'fallido'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding: '7px 16px', borderRadius: 50, border: 'none', background: filtro === f ? 'var(--c-primary)' : 'var(--c-surface2)', color: filtro === f ? '#fff' : 'var(--c-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-muted)' }}>Cargando...</div>}

      {error && (
        <button onClick={() => fetchPedidos(true)} style={{ width: '100%', textAlign: 'center', padding: '30px 20px', color: '#EF4444', fontSize: 13, background: 'rgba(239,68,68,0.08)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontFamily: 'inherit' }}>
          {error}
        </button>
      )}

      {!loading && !error && pedidos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Sin pedidos</div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
            {filtro === 'todos' ? 'Aún no tienes pedidos en los últimos 90 días' : `No hay pedidos con estado "${filtro}"`}
          </div>
        </div>
      )}

      {pedidos.map(p => {
        const col = colors[p.estado] || colors.entregado
        return (
          <div key={p.id} style={{ background: 'var(--c-surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--c-border)', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{p.codigo}</span>
                <span style={{ background: col.bg, color: col.c, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize' }}>{p.estado}</span>
                <span style={{ background: p.metodo_pago === 'tarjeta' ? '#DBEAFE' : '#DCFCE7', color: p.metodo_pago === 'tarjeta' ? '#1E40AF' : '#166534', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{p.metodo_pago === 'tarjeta' ? '💳' : '💵'}</span>
                <span style={{ background: p.canal === 'pidogo' ? '#F3E8FF' : '#FFF7ED', color: p.canal === 'pidogo' ? '#6B21A8' : '#C2410C', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{p.canal === 'pidogo' ? 'PIDOGO' : 'PIDO'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-muted)' }}>
              <span>{p.socios?.nombre || 'Sin repartidor'}</span>
              <span style={{ fontWeight: 700, color: 'var(--c-text)' }}>{(p.total || 0).toFixed(2)} €</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 4 }}>{new Date(p.created_at).toLocaleString('es')}</div>
          </div>
        )
      })}

      {hayMas && !loading && (
        <button onClick={cargarMas} disabled={cargandoMas} style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
          {cargandoMas ? 'Cargando...' : 'Cargar más pedidos'}
        </button>
      )}

      {pedidos.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-muted)', marginTop: 12 }}>
          Mostrando últimos 90 días
        </div>
      )}
    </div>
  )
}
