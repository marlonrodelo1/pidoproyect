import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function StatCard({ label, value, sub, color = '#FF6B2C' }) {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ pedidos: 0, ventas: 0, comisiones: 0, usuarios: 0, socios: 0, establecimientos: 0 })
  const [periodo, setPeriodo] = useState('hoy')
  const [recientes, setRecientes] = useState([])

  useEffect(() => {
    loadStats()
    loadRecientes()
  }, [periodo])

  async function loadStats() {
    const now = new Date()
    let desde
    if (periodo === 'hoy') desde = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    else if (periodo === 'semana') { const d = new Date(now); d.setDate(d.getDate() - 7); desde = d.toISOString() }
    else { const d = new Date(now); d.setMonth(d.getMonth() - 1); desde = d.toISOString() }

    const [pedidosRes, usersRes, sociosRes, estRes] = await Promise.all([
      supabase.from('pedidos').select('total, estado').gte('created_at', desde),
      supabase.from('usuarios').select('id', { count: 'exact', head: true }),
      supabase.from('socios').select('id', { count: 'exact', head: true }),
      supabase.from('establecimientos').select('id', { count: 'exact', head: true }),
    ])

    const pedidos = pedidosRes.data || []
    const entregados = pedidos.filter(p => p.estado === 'entregado')
    const ventas = entregados.reduce((s, p) => s + (p.total || 0), 0)

    setStats({
      pedidos: pedidos.length,
      ventas,
      comisiones: ventas * 0.10,
      usuarios: usersRes.count || 0,
      socios: sociosRes.count || 0,
      establecimientos: estRes.count || 0,
    })
  }

  async function loadRecientes() {
    const { data } = await supabase.from('pedidos')
      .select('id, codigo, total, estado, metodo_pago, canal, created_at')
      .order('created_at', { ascending: false }).limit(10)
    setRecientes(data || [])
  }

  const estadoColor = { nuevo: '#3B82F6', aceptado: '#F59E0B', preparando: '#F59E0B', listo: '#8B5CF6', recogido: '#8B5CF6', en_camino: '#3B82F6', entregado: '#16A34A', cancelado: '#EF4444', fallido: '#EF4444' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {['hoy', 'semana', 'mes'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              background: periodo === p ? '#FF6B2C' : '#F3F4F6', color: periodo === p ? '#fff' : '#6B7280',
            }}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Pedidos" value={stats.pedidos} />
        <StatCard label="Ventas" value={`${stats.ventas.toFixed(2)}EUR`} color="#16A34A" />
        <StatCard label="Comisiones Plataforma" value={`${stats.comisiones.toFixed(2)}EUR`} color="#8B5CF6" />
        <StatCard label="Usuarios" value={stats.usuarios} color="#3B82F6" />
        <StatCard label="Socios Activos" value={stats.socios} color="#F59E0B" />
        <StatCard label="Establecimientos" value={stats.establecimientos} color="#EF4444" />
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Pedidos recientes</h2>
      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span style={{ width: 90 }}>Codigo</span>
          <span style={{ width: 80 }}>Total</span>
          <span style={{ width: 80 }}>Estado</span>
          <span style={{ width: 70 }}>Pago</span>
          <span style={{ width: 70 }}>Canal</span>
          <span style={{ flex: 1 }}>Fecha</span>
        </div>
        {recientes.map(p => (
          <div key={p.id} style={styles.tableRow}>
            <span style={{ width: 90, fontWeight: 700, fontSize: 12 }}>{p.codigo}</span>
            <span style={{ width: 80, fontSize: 12 }}>{p.total?.toFixed(2)}EUR</span>
            <span style={{ width: 80 }}>
              <span style={{ ...styles.badge, background: (estadoColor[p.estado] || '#6B7280') + '15', color: estadoColor[p.estado] || '#6B7280' }}>{p.estado}</span>
            </span>
            <span style={{ width: 70 }}>
              <span style={{ ...styles.badge, background: p.metodo_pago === 'tarjeta' ? '#DBEAFE' : '#FEF3C7', color: p.metodo_pago === 'tarjeta' ? '#1D4ED8' : '#92400E' }}>
                {p.metodo_pago === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}
              </span>
            </span>
            <span style={{ width: 70 }}>
              <span style={{ ...styles.badge, background: p.canal === 'pido' ? '#FFF3ED' : '#F0FDF4', color: p.canal === 'pido' ? '#FF6B2C' : '#166534' }}>
                {p.canal === 'pido' ? 'PIDO' : 'PIDOGO'}
              </span>
            </span>
            <span style={{ flex: 1, fontSize: 11, color: '#9CA3AF' }}>{new Date(p.created_at).toLocaleString('es-ES')}</span>
          </div>
        ))}
        {recientes.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin pedidos</div>}
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#fff', borderRadius: 14, padding: '20px 22px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  table: { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  tableHeader: {
    display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 12,
    fontSize: 11, fontWeight: 700, color: '#9CA3AF', borderBottom: '1px solid #F3F4F6', textTransform: 'uppercase',
  },
  tableRow: {
    display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 12,
    borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s',
  },
  badge: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize' },
}
