import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSocio } from '../context/SocioContext'

export default function Informes() {
  const { socio } = useSocio()
  const [facturas, setFacturas] = useState([])
  const [verDetalle, setVerDetalle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (socio) fetchFacturas() }, [socio?.id])

  async function fetchFacturas() {
    const { data } = await supabase
      .from('facturas_semanales')
      .select('*, establecimientos(nombre)')
      .eq('socio_id', socio.id)
      .order('semana_inicio', { ascending: false })
      .limit(20)
    setFacturas(data || [])
    setLoading(false)
  }

  // Agrupar por semana
  const porSemana = {}
  for (const f of facturas) {
    const key = `${f.semana_inicio}_${f.semana_fin}`
    if (!porSemana[key]) porSemana[key] = { inicio: f.semana_inicio, fin: f.semana_fin, facturas: [] }
    porSemana[key].facturas.push(f)
  }
  const semanas = Object.values(porSemana)

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Informes y facturación</h2>
      <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 20 }}>Resumen semanal de pedidos y ganancias.</p>

      {loading && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-muted)' }}>Cargando...</div>}

      {!loading && semanas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--c-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aún no hay informes</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Se generan automáticamente cada lunes</div>
        </div>
      )}

      {semanas.map((s, si) => {
        const totalPedidos = s.facturas.reduce((sum, f) => sum + f.total_pedidos, 0)
        const totalGanado = s.facturas.reduce((sum, f) => sum + f.total_ganado, 0)
        const totalEntregados = s.facturas.reduce((sum, f) => sum + f.pedidos_entregados, 0)
        const totalCancelados = s.facturas.reduce((sum, f) => sum + f.pedidos_cancelados, 0)
        const isOpen = verDetalle === si

        return (
          <div key={si} style={{ background: 'var(--c-surface)', borderRadius: 16, padding: 20, border: '1px solid var(--c-border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Semana {s.inicio} — {s.fin}</div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{totalPedidos} pedidos · {totalEntregados} entregados · {totalCancelados} cancelados</div>
              </div>
            </div>

            <div style={{ background: 'var(--c-surface2)', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>Total ganado</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#16A34A' }}>{totalGanado.toFixed(2)} €</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>Pedidos</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{totalPedidos}</div>
              </div>
            </div>

            <button onClick={() => setVerDetalle(isOpen ? null : si)} style={{
              width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid var(--c-border)',
              background: 'var(--c-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {isOpen ? 'Ocultar detalle' : 'Ver detalle por restaurante'}
              <span style={{ fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {isOpen && (
              <div style={{ marginTop: 16, animation: 'fadeIn 0.3s ease' }}>
                {s.facturas.map((f, fi) => (
                  <div key={fi} style={{ padding: '14px 0', borderBottom: fi < s.facturas.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{f.establecimientos?.nombre}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#16A34A' }}>+{f.total_ganado.toFixed(2)} €</span>
                    </div>
                    {f.numero_factura && <div style={{ fontSize: 10, color: 'var(--c-accent)', fontWeight: 600, marginBottom: 6 }}>{f.numero_factura}</div>}
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--c-muted)', flexWrap: 'wrap' }}>
                      <span>{f.pedidos_entregados} entregados</span>
                      {f.pedidos_fallidos > 0 && <span style={{ color: '#EF4444' }}>{f.pedidos_fallidos} fallidos</span>}
                      <span>Comisión: {f.total_comisiones.toFixed(2)} €</span>
                      <span>Envíos: {f.total_envios.toFixed(2)} €</span>
                      <span>Propinas: {f.total_propinas.toFixed(2)} €</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--c-muted)', marginTop: 4 }}>
                      <span>💳 Tarjeta: {f.pedidos_tarjeta} ({f.ventas_tarjeta?.toFixed(2)} €)</span>
                      <span>💵 Efectivo: {f.pedidos_efectivo} ({f.ventas_efectivo?.toFixed(2)} €)</span>
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
