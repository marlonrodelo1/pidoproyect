import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function StatCard({ label, value, color = '#111827' }) {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: -1 }}>{value}</div>
    </div>
  )
}

export default function Finanzas() {
  const [tab, setTab] = useState('resumen')
  const [balancesRest, setBalancesRest] = useState([])
  const [balancesSocio, setBalancesSocio] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [resumen, setResumen] = useState({ comisionesTotal: 0, pagadoRest: 0, pagadoSocio: 0, pendiente: 0 })

  useEffect(() => {
    loadResumen()
    loadBalancesRest()
    loadBalancesSocio()
    loadMovimientos()
  }, [])

  async function loadResumen() {
    const { data: comisiones } = await supabase.from('comisiones').select('comision_plataforma, estado_pago')
    const all = comisiones || []
    const comisionesTotal = all.reduce((s, c) => s + (c.comision_plataforma || 0), 0)
    const pagado = all.filter(c => c.estado_pago === 'pagado').reduce((s, c) => s + (c.comision_plataforma || 0), 0)
    setResumen({ comisionesTotal, pagadoRest: 0, pagadoSocio: 0, pendiente: comisionesTotal - pagado })
  }

  async function loadBalancesRest() {
    const { data } = await supabase.from('balances_restaurante').select('*, establecimientos(nombre)')
      .order('created_at', { ascending: false }).limit(50)
    setBalancesRest(data || [])
  }

  async function loadBalancesSocio() {
    const { data } = await supabase.from('balances_socio').select('*, socios(nombre, nombre_comercial)')
      .order('created_at', { ascending: false }).limit(50)
    setBalancesSocio(data || [])
  }

  async function loadMovimientos() {
    const { data } = await supabase.from('movimientos_cuenta').select('*')
      .order('created_at', { ascending: false }).limit(100)
    setMovimientos(data || [])
  }

  async function marcarPagado(tabla, id) {
    await supabase.from(tabla).update({ estado: 'pagado', pagado_at: new Date().toISOString() }).eq('id', id)
    loadBalancesRest()
    loadBalancesSocio()
  }

  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'restaurantes', label: 'Balance Restaurantes' },
    { id: 'socios', label: 'Balance Socios' },
    { id: 'movimientos', label: 'Movimientos' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Finanzas</h1>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            ...styles.tabBtn,
            background: tab === t.id ? '#FF6B2C' : '#F3F4F6',
            color: tab === t.id ? '#fff' : '#6B7280',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <StatCard label="Comisiones totales plataforma" value={`${resumen.comisionesTotal.toFixed(2)}EUR`} color="#16A34A" />
          <StatCard label="Pendiente de cobro" value={`${resumen.pendiente.toFixed(2)}EUR`} color="#F59E0B" />
        </div>
      )}

      {tab === 'restaurantes' && (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span style={{ flex: 1 }}>Restaurante</span>
            <span style={{ width: 80 }}>Tarjeta</span>
            <span style={{ width: 80 }}>Efectivo</span>
            <span style={{ width: 90 }}>A favor</span>
            <span style={{ width: 90 }}>Debe</span>
            <span style={{ width: 90 }}>Balance</span>
            <span style={{ width: 80 }}>Estado</span>
            <span style={{ width: 70 }}></span>
          </div>
          {balancesRest.map(b => (
            <div key={b.id} style={styles.tableRow}>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{b.establecimientos?.nombre || '-'}</span>
              <span style={{ width: 80, fontSize: 12 }}>{b.pedidos_tarjeta}</span>
              <span style={{ width: 80, fontSize: 12 }}>{b.pedidos_efectivo}</span>
              <span style={{ width: 90, fontSize: 12, color: '#16A34A' }}>{b.a_favor_restaurante?.toFixed(2)}EUR</span>
              <span style={{ width: 90, fontSize: 12, color: '#EF4444' }}>{b.debe_restaurante?.toFixed(2)}EUR</span>
              <span style={{ width: 90, fontSize: 12, fontWeight: 700, color: b.balance_neto >= 0 ? '#16A34A' : '#EF4444' }}>{b.balance_neto?.toFixed(2)}EUR</span>
              <span style={{ width: 80 }}>
                <span style={{ ...styles.badge, background: b.estado === 'pagado' ? '#DCFCE7' : '#FEF3C7', color: b.estado === 'pagado' ? '#166534' : '#92400E' }}>{b.estado}</span>
              </span>
              <span style={{ width: 70 }}>
                {b.estado === 'pendiente' && <button onClick={() => marcarPagado('balances_restaurante', b.id)} style={styles.actionBtn}>Pagar</button>}
              </span>
            </div>
          ))}
          {balancesRest.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin balances</div>}
        </div>
      )}

      {tab === 'socios' && (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span style={{ flex: 1 }}>Socio</span>
            <span style={{ width: 90 }}>Comisiones</span>
            <span style={{ width: 80 }}>Envios</span>
            <span style={{ width: 80 }}>Propinas</span>
            <span style={{ width: 90 }}>Total pagar</span>
            <span style={{ width: 90 }}>Efectivo</span>
            <span style={{ width: 80 }}>Estado</span>
            <span style={{ width: 70 }}></span>
          </div>
          {balancesSocio.map(b => (
            <div key={b.id} style={styles.tableRow}>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{b.socios?.nombre_comercial || b.socios?.nombre || '-'}</span>
              <span style={{ width: 90, fontSize: 12 }}>{b.comisiones_tarjeta?.toFixed(2)}EUR</span>
              <span style={{ width: 80, fontSize: 12 }}>{b.envios_tarjeta?.toFixed(2)}EUR</span>
              <span style={{ width: 80, fontSize: 12 }}>{b.propinas_tarjeta?.toFixed(2)}EUR</span>
              <span style={{ width: 90, fontSize: 12, fontWeight: 700, color: '#16A34A' }}>{b.total_pagar_socio?.toFixed(2)}EUR</span>
              <span style={{ width: 90, fontSize: 12, color: '#6B7280' }}>{b.total_efectivo_recaudado?.toFixed(2)}EUR</span>
              <span style={{ width: 80 }}>
                <span style={{ ...styles.badge, background: b.estado === 'pagado' ? '#DCFCE7' : '#FEF3C7', color: b.estado === 'pagado' ? '#166534' : '#92400E' }}>{b.estado}</span>
              </span>
              <span style={{ width: 70 }}>
                {b.estado === 'pendiente' && <button onClick={() => marcarPagado('balances_socio', b.id)} style={styles.actionBtn}>Pagar</button>}
              </span>
            </div>
          ))}
          {balancesSocio.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin balances</div>}
        </div>
      )}

      {tab === 'movimientos' && (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span style={{ width: 140 }}>Tipo</span>
            <span style={{ width: 100 }}>Monto</span>
            <span style={{ flex: 1 }}>Descripcion</span>
            <span style={{ width: 100 }}>Referencia</span>
            <span style={{ width: 140 }}>Fecha</span>
          </div>
          {movimientos.map(m => {
            const tipoColor = { entrada_tarjeta: '#16A34A', pago_restaurante: '#3B82F6', pago_socio: '#8B5CF6', cobro_comision: '#F59E0B' }
            return (
              <div key={m.id} style={styles.tableRow}>
                <span style={{ width: 140 }}><span style={{ ...styles.badge, background: (tipoColor[m.tipo] || '#6B7280') + '15', color: tipoColor[m.tipo] || '#6B7280' }}>{m.tipo?.replace('_', ' ')}</span></span>
                <span style={{ width: 100, fontSize: 13, fontWeight: 700 }}>{m.monto?.toFixed(2)}EUR</span>
                <span style={{ flex: 1, fontSize: 12, color: '#6B7280' }}>{m.descripcion || '-'}</span>
                <span style={{ width: 100, fontSize: 11, color: '#9CA3AF' }}>{m.referencia || '-'}</span>
                <span style={{ width: 140, fontSize: 11, color: '#9CA3AF' }}>{new Date(m.created_at).toLocaleString('es-ES')}</span>
              </div>
            )
          })}
          {movimientos.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin movimientos</div>}
        </div>
      )}
    </div>
  )
}

const styles = {
  card: { background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  tabBtn: { padding: '7px 16px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  table: { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  tableHeader: { display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 12, fontSize: 11, fontWeight: 700, color: '#9CA3AF', borderBottom: '1px solid #F3F4F6', textTransform: 'uppercase' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 12, borderBottom: '1px solid #F9FAFB' },
  badge: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize' },
  actionBtn: { padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", background: '#DCFCE7', color: '#166534' },
}
