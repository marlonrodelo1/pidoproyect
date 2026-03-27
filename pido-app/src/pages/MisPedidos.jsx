import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ESTADO_COLORS = {
  entregado: { bg: '#DCFCE7', c: '#166534' },
  cancelado: { bg: '#FEE2E2', c: '#991B1B' },
  fallido: { bg: '#FEE2E2', c: '#991B1B' },
  nuevo: { bg: '#DBEAFE', c: '#1E40AF' },
  preparando: { bg: '#FEF3C7', c: '#92400E' },
  en_camino: { bg: '#DCFCE7', c: '#166534' },
}

export default function MisPedidos({ onTrack }) {
  const { user } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchPedidos()
  }, [user])

  async function fetchPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('*, establecimientos(nombre)')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setPedidos(data || [])
    setLoading(false)
  }

  function formatFecha(f) {
    const d = new Date(f)
    const hoy = new Date()
    if (d.toDateString() === hoy.toDateString()) return `Hoy, ${d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1)
    if (d.toDateString() === ayer.toDateString()) return `Ayer, ${d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)', margin: '0 0 16px' }}>Mis pedidos</h2>
      {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-muted)' }}>Cargando...</div>}
      {!loading && pedidos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--c-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aún no tienes pedidos</div>
        </div>
      )}
      {pedidos.map(p => {
        const colors = ESTADO_COLORS[p.estado] || ESTADO_COLORS.nuevo
        return (
          <div key={p.id} style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--c-border)', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>{p.establecimientos?.nombre || 'Restaurante'}</span>
              <span style={{ background: colors.bg, color: colors.c, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize' }}>{p.estado.replace('_', ' ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-muted)', marginBottom: 4 }}>
              <span>{p.codigo}</span>
              <span>{p.metodo_pago === 'tarjeta' ? '💳' : '💵'} {p.metodo_pago}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-muted)' }}>
              <span>{formatFecha(p.created_at)}</span>
              <span style={{ fontWeight: 700, color: 'var(--c-text)' }}>{p.total.toFixed(2)} €</span>
            </div>
            {['nuevo', 'aceptado', 'preparando', 'listo', 'en_camino', 'recogido'].includes(p.estado) && (
              <button onClick={() => onTrack(p)} style={{
                width: '100%', marginTop: 10, padding: '8px 0', borderRadius: 8,
                border: 'none', background: 'var(--c-primary)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', color: '#fff',
              }}>Seguir pedido</button>
            )}
          </div>
        )
      })}
    </div>
  )
}
