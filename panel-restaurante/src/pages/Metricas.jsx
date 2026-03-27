import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRest } from '../context/RestContext'

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: accent ? 'var(--c-primary)' : 'var(--c-surface)', borderRadius: 14, padding: '14px 16px', border: accent ? 'none' : '1px solid var(--c-border)', flex: '1 1 140px', minWidth: 140 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: accent ? 'rgba(255,255,255,0.7)' : 'var(--c-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: accent ? '#fff' : 'var(--c-text)', letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: accent ? 'rgba(255,255,255,0.5)' : 'var(--c-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

export default function Metricas() {
  const { restaurante } = useRest()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (restaurante) fetchStats() }, [restaurante?.id])

  async function fetchStats() {
    const hoy = new Date()
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()
    const inicioSemana = new Date(hoy); inicioSemana.setDate(inicioSemana.getDate() - 7)

    const { data: pedidosHoy } = await supabase.from('pedidos').select('total, metodo_pago, estado, minutos_preparacion')
      .eq('establecimiento_id', restaurante.id).gte('created_at', inicioHoy)

    const { data: pedidosSemana } = await supabase.from('pedidos').select('total, estado')
      .eq('establecimiento_id', restaurante.id).gte('created_at', inicioSemana.toISOString())

    const all = pedidosHoy || []
    const entregadosHoy = all.filter(p => p.estado === 'entregado')
    const allSemana = pedidosSemana || []
    const entregadosSemana = allSemana.filter(p => p.estado === 'entregado')

    const ventasTarjeta = entregadosHoy.filter(p => p.metodo_pago === 'tarjeta').reduce((s, p) => s + p.total, 0)
    const ventasEfectivo = entregadosHoy.filter(p => p.metodo_pago === 'efectivo').reduce((s, p) => s + p.total, 0)
    const tiempos = entregadosHoy.filter(p => p.minutos_preparacion).map(p => p.minutos_preparacion)
    const tiempoMedio = tiempos.length > 0 ? Math.round(tiempos.reduce((s, t) => s + t, 0) / tiempos.length) : 0

    setStats({
      pedidosHoy: all.length,
      ventasHoy: ventasTarjeta + ventasEfectivo,
      ventasTarjeta, ventasEfectivo,
      pedidosTarjeta: entregadosHoy.filter(p => p.metodo_pago === 'tarjeta').length,
      pedidosEfectivo: entregadosHoy.filter(p => p.metodo_pago === 'efectivo').length,
      ticketMedio: entregadosHoy.length > 0 ? (entregadosHoy.reduce((s, p) => s + p.total, 0) / entregadosHoy.length) : 0,
      tiempoMedio,
      canceladosHoy: all.filter(p => p.estado === 'cancelado').length,
      pedidosSemana: allSemana.length,
      ventasSemana: entregadosSemana.reduce((s, p) => s + p.total, 0),
    })
    setLoading(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-muted)' }}>Cargando métricas...</div>

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>Métricas</h2>

      {/* Ventas del día */}
      <div style={{ background: 'linear-gradient(135deg, #B91C1C, #DC2626)', borderRadius: 16, padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Ventas hoy</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>{stats.ventasHoy?.toFixed(2)} €</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
          <span>💳 {stats.ventasTarjeta?.toFixed(2)} € ({stats.pedidosTarjeta})</span>
          <span>💵 {stats.ventasEfectivo?.toFixed(2)} € ({stats.pedidosEfectivo})</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <StatCard label="Pedidos hoy" value={stats.pedidosHoy} />
        <StatCard label="Ticket medio" value={`${stats.ticketMedio?.toFixed(2)} €`} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <StatCard label="Tiempo medio prep." value={`${stats.tiempoMedio} min`} />
        <StatCard label="Cancelados" value={stats.canceladosHoy} />
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '24px 0 14px' }}>Resumen semanal</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <StatCard label="Pedidos semana" value={stats.pedidosSemana} accent />
        <StatCard label="Ventas semana" value={`${stats.ventasSemana?.toFixed(0)} €`} />
      </div>
    </div>
  )
}
