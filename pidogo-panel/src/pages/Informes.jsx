import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSocio } from '../context/SocioContext'

export default function Informes() {
  const { socio } = useSocio()
  const [totalesGlobal, setTotalesGlobal] = useState({ comisiones: 0, envios: 0, propinas: 0, total: 0 })
  const [semanaActual, setSemanaActual] = useState([]) // ganancias en curso por restaurante
  const [facturas, setFacturas] = useState([])
  const [verDetalle, setVerDetalle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (socio) { fetchTodo() } }, [socio?.id])

  async function fetchTodo() {
    setLoading(true)

    // 1. Total global (últimos 6 meses)
    const hace6m = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
    const { data: allCom } = await supabase.from('comisiones').select('comision_socio, envio_socio, propina_socio').eq('socio_id', socio.id).gte('created_at', hace6m)
    let com = 0, env = 0, prop = 0
    for (const c of (allCom || [])) { com += c.comision_socio || 0; env += c.envio_socio || 0; prop += c.propina_socio || 0 }
    setTotalesGlobal({ comisiones: com, envios: env, propinas: prop, total: com + env + prop })

    // 2. Semana actual en curso (lunes actual hasta hoy)
    const hoy = new Date()
    const dia = hoy.getDay() || 7
    const lunesActual = new Date(hoy)
    lunesActual.setDate(hoy.getDate() - dia + 1)
    lunesActual.setHours(0, 0, 0, 0)

    const { data: pedidosSemana } = await supabase.from('pedidos')
      .select('id, subtotal, coste_envio, propina, estado, metodo_pago, establecimiento_id, establecimientos(nombre)')
      .eq('socio_id', socio.id)
      .gte('created_at', lunesActual.toISOString())
      .in('estado', ['entregado'])

    const { data: comSemana } = await supabase.from('comisiones')
      .select('comision_socio, envio_socio, propina_socio, establecimiento_id')
      .eq('socio_id', socio.id)
      .gte('created_at', lunesActual.toISOString())

    // Agrupar por restaurante
    const porRest = {}
    for (const p of (pedidosSemana || [])) {
      const eid = p.establecimiento_id
      if (!porRest[eid]) porRest[eid] = { nombre: p.establecimientos?.nombre || '—', pedidos: 0, comisiones: 0, envios: 0, propinas: 0 }
      porRest[eid].pedidos++
    }
    for (const c of (comSemana || [])) {
      const eid = c.establecimiento_id
      if (!porRest[eid]) porRest[eid] = { nombre: '—', pedidos: 0, comisiones: 0, envios: 0, propinas: 0 }
      porRest[eid].comisiones += c.comision_socio || 0
      porRest[eid].envios += c.envio_socio || 0
      porRest[eid].propinas += c.propina_socio || 0
    }
    setSemanaActual(Object.values(porRest))

    // 3. Facturas cerradas (semanas anteriores)
    const { data: facs } = await supabase.from('facturas_semanales').select('*, establecimientos(nombre)')
      .eq('socio_id', socio.id).order('semana_inicio', { ascending: false }).limit(30)
    setFacturas(facs || [])

    setLoading(false)
  }

  // Agrupar facturas por semana
  const porSemana = {}
  for (const f of facturas) {
    const key = `${f.semana_inicio}_${f.semana_fin}`
    if (!porSemana[key]) porSemana[key] = { inicio: f.semana_inicio, fin: f.semana_fin, facturas: [] }
    porSemana[key].facturas.push(f)
  }
  const semanas = Object.values(porSemana)

  const totalSemanaActual = semanaActual.reduce((s, r) => s + r.comisiones + r.envios + r.propinas, 0)
  const pedidosSemanaActual = semanaActual.reduce((s, r) => s + r.pedidos, 0)

  if (loading) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-muted)' }}>Cargando...</div>

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>Informes y facturación</h2>

      {/* Total global */}
      <div style={{ background: 'linear-gradient(135deg, #FF5733 0%, #FF8F73 100%)', borderRadius: 16, padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Total ganado hasta la fecha</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>{totalesGlobal.total.toFixed(2)} €</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
          <span>Comisiones: {totalesGlobal.comisiones.toFixed(2)} €</span>
          <span>Envíos: {totalesGlobal.envios.toFixed(2)} €</span>
          <span>Propinas: {totalesGlobal.propinas.toFixed(2)} €</span>
        </div>
      </div>

      {/* Semana en curso */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 16, padding: 20, border: '1px solid var(--c-border)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Esta semana</div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>{pedidosSemanaActual} pedidos entregados</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A' }}>{totalSemanaActual.toFixed(2)} €</div>
        </div>

        {semanaActual.length === 0 && <div style={{ fontSize: 12, color: 'var(--c-muted)', textAlign: 'center', padding: '10px 0' }}>Sin pedidos esta semana</div>}

        {semanaActual.map((r, i) => {
          const total = r.comisiones + r.envios + r.propinas
          return (
            <div key={i} style={{ padding: '10px 0', borderTop: '1px solid var(--c-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{r.nombre}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#16A34A' }}>+{total.toFixed(2)} €</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                {r.pedidos} pedidos · Com: {r.comisiones.toFixed(2)} € · Envíos: {r.envios.toFixed(2)} € · Prop: {r.propinas.toFixed(2)} €
              </div>
            </div>
          )
        })}

        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 12, textAlign: 'center' }}>La factura se cierra automáticamente cada lunes</div>
      </div>

      {/* Facturas cerradas */}
      {semanas.length > 0 && <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 14px' }}>Facturas cerradas</h3>}

      {semanas.map((s, si) => {
        const totalGanado = s.facturas.reduce((sum, f) => sum + f.total_ganado, 0)
        const totalPedidos = s.facturas.reduce((sum, f) => sum + f.total_pedidos, 0)
        const totalEntregados = s.facturas.reduce((sum, f) => sum + f.pedidos_entregados, 0)
        const isOpen = verDetalle === si

        return (
          <div key={si} style={{ background: 'var(--c-surface)', borderRadius: 16, padding: 20, border: '1px solid var(--c-border)', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Semana {s.inicio} — {s.fin}</div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{totalEntregados} entregados de {totalPedidos}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A' }}>{totalGanado.toFixed(2)} €</div>
            </div>

            <button onClick={() => setVerDetalle(isOpen ? null : si)} style={{
              width: '100%', padding: '8px 0', borderRadius: 8, border: '1px solid var(--c-border)',
              background: 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              {isOpen ? 'Ocultar' : `Ver ${s.facturas.length} facturas`}
              <span style={{ fontSize: 9, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {isOpen && (
              <div style={{ marginTop: 14, animation: 'fadeIn 0.3s ease' }}>
                {s.facturas.map((f, fi) => (
                  <div key={fi} style={{ padding: '14px 0', borderTop: '1px solid var(--c-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{f.establecimientos?.nombre}</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#16A34A' }}>+{f.total_ganado.toFixed(2)} €</span>
                    </div>
                    {f.numero_factura && <div style={{ fontSize: 10, color: 'var(--c-accent)', fontWeight: 700, marginBottom: 6 }}>{f.numero_factura}</div>}
                    <div style={{ fontSize: 11, color: 'var(--c-muted)', lineHeight: 1.6 }}>
                      Pedidos: {f.pedidos_entregados} · Comisión: {f.total_comisiones.toFixed(2)} € · Envíos: {f.total_envios.toFixed(2)} € · Propinas: {f.total_propinas.toFixed(2)} €
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>💳 {f.pedidos_tarjeta} · 💵 {f.pedidos_efectivo}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 700, background: f.estado === 'pagado' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: f.estado === 'pagado' ? '#4ADE80' : '#FBBF24' }}>
                        {f.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
