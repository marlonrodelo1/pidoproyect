import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSocio } from '../context/SocioContext'

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: accent ? 'var(--c-accent)' : 'var(--c-surface)', borderRadius: 14, padding: '16px 18px', border: accent ? 'none' : '1px solid var(--c-border)', flex: '1 1 140px', minWidth: 140 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: accent ? 'rgba(255,255,255,0.7)' : 'var(--c-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent ? '#fff' : 'var(--c-text)', letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: accent ? 'rgba(255,255,255,0.5)' : 'var(--c-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function PagoBadge({ pago }) {
  const t = pago === 'tarjeta'
  return <span style={{ background: t ? '#DBEAFE' : '#DCFCE7', color: t ? '#1E40AF' : '#166534', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{t ? '💳' : '💵'} {t ? 'Tarjeta' : 'Efectivo'}</span>
}

function EstadoBadge({ estado }) {
  const c = { entregado: { bg: '#DCFCE7', color: '#166534' }, cancelado: { bg: '#FEE2E2', color: '#991B1B' }, fallido: { bg: '#FEF3C7', color: '#92400E' } }[estado] || { bg: '#F3F2EF', color: '#8C8A85' }
  return <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, textTransform: 'capitalize' }}>{estado?.replace('_', ' ')}</span>
}

export default function Dashboard() {
  const { socio } = useSocio()
  const [periodo, setPeriodo] = useState('semana')
  const [stats, setStats] = useState({ pedidos: 0, comisiones: 0, envios: 0, propinas: 0, ventas: 0 })
  const [ultimosPedidos, setUltimosPedidos] = useState([])

  useEffect(() => { if (socio) fetchStats() }, [socio?.id, periodo])

  async function fetchStats() {
    const now = new Date()
    let desde
    if (periodo === 'hoy') { desde = new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
    else if (periodo === 'semana') { desde = new Date(now); desde.setDate(desde.getDate() - 7) }
    else { desde = new Date(now); desde.setMonth(desde.getMonth() - 1) }

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id, total, subtotal, coste_envio, propina, estado, metodo_pago, codigo, canal, created_at, establecimientos(nombre)')
      .eq('socio_id', socio.id)
      .gte('created_at', desde.toISOString())
      .order('created_at', { ascending: false })

    const all = pedidos || []
    const entregados = all.filter(p => p.estado === 'entregado')

    const { data: comisiones } = await supabase
      .from('comisiones')
      .select('comision_socio, envio_socio, propina_socio')
      .eq('socio_id', socio.id)
      .gte('created_at', desde.toISOString())

    let totalCom = 0, totalEnv = 0, totalProp = 0
    for (const c of comisiones || []) {
      totalCom += c.comision_socio || 0
      totalEnv += c.envio_socio || 0
      totalProp += c.propina_socio || 0
    }

    setStats({
      pedidos: all.length,
      cancelados: all.filter(p => p.estado === 'cancelado').length,
      ventas: entregados.reduce((s, p) => s + (p.subtotal || 0), 0),
      comisiones: totalCom, envios: totalEnv, propinas: totalProp,
    })
    setUltimosPedidos(all.slice(0, 5))
  }

  const totalGanado = stats.comisiones + stats.envios + stats.propinas

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Dashboard</h2>
        <div style={{ display: 'flex', gap: 4, background: 'var(--c-surface2)', borderRadius: 10, padding: 3 }}>
          {['hoy', 'semana', 'mes'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: periodo === p ? 'var(--c-accent)' : 'transparent', color: periodo === p ? '#fff' : 'var(--c-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Total ganado */}
      <div style={{ background: 'linear-gradient(135deg, #FF5733 0%, #FF8F73 100%)', borderRadius: 16, padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Total ganado</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>{totalGanado.toFixed(2)} €</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
          <span>Comisiones: {stats.comisiones.toFixed(2)} €</span>
          <span>Envíos: {stats.envios.toFixed(2)} €</span>
          <span>Propinas: {stats.propinas.toFixed(2)} €</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <StatCard label="Pedidos" value={stats.pedidos} sub={`${stats.cancelados || 0} cancelados`} />
        <StatCard label="Ventas totales" value={`${stats.ventas.toFixed(0)} €`} />
      </div>

      {/* Últimos pedidos */}
      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '24px 0 14px' }}>Últimos pedidos</h3>
      {ultimosPedidos.map(p => (
        <div key={p.id} style={{ background: 'var(--c-surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--c-border)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{p.codigo}</span>
              <EstadoBadge estado={p.estado} />
              <PagoBadge pago={p.metodo_pago} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{p.establecimientos?.nombre}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{p.total.toFixed(2)} €</div>
          </div>
        </div>
      ))}
    </div>
  )
}
