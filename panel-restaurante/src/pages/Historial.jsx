import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRest } from '../context/RestContext'

export default function Historial() {
  const { restaurante } = useRest()
  const [pedidos, setPedidos] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (restaurante) fetchPedidos() }, [restaurante?.id, filtro])

  async function fetchPedidos() {
    setLoading(true)
    let query = supabase.from('pedidos')
      .select('*, socios(nombre)')
      .eq('establecimiento_id', restaurante.id)
      .in('estado', filtro === 'todos' ? ['entregado', 'cancelado', 'fallido'] : [filtro])
      .order('created_at', { ascending: false })
      .limit(50)

    const { data } = await query
    setPedidos(data || [])
    setLoading(false)
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
              <span style={{ fontWeight: 700, color: 'var(--c-text)' }}>{p.total.toFixed(2)} €</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 4 }}>{new Date(p.created_at).toLocaleString('es')}</div>
          </div>
        )
      })}
    </div>
  )
}
