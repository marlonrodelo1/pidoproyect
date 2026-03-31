import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useSocio } from '../context/SocioContext'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

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
  return <span style={{ background: t ? 'rgba(96,165,250,0.15)' : 'rgba(74,222,128,0.12)', color: t ? '#60A5FA' : '#4ADE80', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{t ? '💳' : '💵'} {t ? 'Tarjeta' : 'Efectivo'}</span>
}

function EstadoBadge({ estado }) {
  const c = { entregado: { bg: 'rgba(74,222,128,0.12)', color: '#4ADE80' }, cancelado: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444' }, fallido: { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' } }[estado] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
  return <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, textTransform: 'capitalize' }}>{estado?.replace('_', ' ')}</span>
}

// Auto-fit map bounds to show all points
function MapFitter({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) {
      const bounds = points.map(p => [p.lat, p.lng])
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 })
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14)
    }
  }, [points, map])
  return null
}

export default function Dashboard() {
  const { socio } = useSocio()
  const [periodo, setPeriodo] = useState('semana')
  const [stats, setStats] = useState({ pedidos: 0, comisiones: 0, envios: 0, propinas: 0, ventas: 0 })
  const [ultimosPedidos, setUltimosPedidos] = useState([])
  const [puntosEntrega, setPuntosEntrega] = useState([])
  const [puntosRestaurante, setPuntosRestaurante] = useState([])

  useEffect(() => { if (socio) fetchStats() }, [socio?.id, periodo])

  async function fetchStats() {
    const now = new Date()
    let desde
    if (periodo === 'hoy') { desde = new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
    else if (periodo === 'semana') { desde = new Date(now); desde.setDate(desde.getDate() - 7) }
    else { desde = new Date(now); desde.setMonth(desde.getMonth() - 1) }

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id, total, subtotal, coste_envio, propina, estado, metodo_pago, codigo, canal, created_at, usuario_id, establecimiento_id, establecimientos(nombre, latitud, longitud)')
      .eq('socio_id', socio.id)
      .gte('created_at', desde.toISOString())
      .order('created_at', { ascending: false })

    const all = pedidos || []
    const entregados = all.filter(p => p.estado === 'entregado')

    // Obtener coordenadas de clientes para el mapa
    const userIds = [...new Set(entregados.map(p => p.usuario_id).filter(Boolean))]
    let userCoords = {}
    if (userIds.length > 0) {
      const { data: usuarios } = await supabase.from('usuarios').select('id, latitud, longitud').in('id', userIds)
      for (const u of usuarios || []) {
        if (u.latitud && u.longitud) userCoords[u.id] = { lat: u.latitud, lng: u.longitud }
      }
    }

    // Puntos de entrega (clientes)
    const puntos = entregados
      .filter(p => userCoords[p.usuario_id])
      .map(p => ({ lat: userCoords[p.usuario_id].lat, lng: userCoords[p.usuario_id].lng, codigo: p.codigo, restaurante: p.establecimientos?.nombre }))
    setPuntosEntrega(puntos)

    // Puntos de restaurantes (únicos)
    const restMap = {}
    for (const p of entregados) {
      if (p.establecimientos?.latitud && p.establecimientos?.longitud) {
        restMap[p.establecimiento_id] = { lat: p.establecimientos.latitud, lng: p.establecimientos.longitud, nombre: p.establecimientos.nombre }
      }
    }
    setPuntosRestaurante(Object.values(restMap))

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

  // Centro del mapa: promedio de puntos o default Canarias
  const mapCenter = useMemo(() => {
    const allPts = [...puntosEntrega, ...puntosRestaurante]
    if (allPts.length === 0) return [28.4148, -16.5477] // Puerto de la Cruz default
    const lat = allPts.reduce((s, p) => s + p.lat, 0) / allPts.length
    const lng = allPts.reduce((s, p) => s + p.lng, 0) / allPts.length
    return [lat, lng]
  }, [puntosEntrega, puntosRestaurante])

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

      {/* Mapa de zona de entregas */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 16, border: '1px solid var(--c-border)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Zona de entregas</div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>
              {puntosEntrega.length} entrega{puntosEntrega.length !== 1 ? 's' : ''} · {puntosRestaurante.length} restaurante{puntosRestaurante.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: '#FF6B2C' }} /> Entregas
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: '#EF4444' }} /> Restaurantes
            </span>
          </div>
        </div>
        <div style={{ height: 220 }}>
          {(puntosEntrega.length > 0 || puntosRestaurante.length > 0) ? (
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <MapFitter points={[...puntosEntrega, ...puntosRestaurante]} />
              {/* Puntos de entrega (naranja) */}
              {puntosEntrega.map((p, i) => (
                <CircleMarker key={`e-${i}`} center={[p.lat, p.lng]} radius={6} pathOptions={{ color: '#FF6B2C', fillColor: '#FF6B2C', fillOpacity: 0.7, weight: 2 }}>
                  <Popup><span style={{ fontSize: 12, fontWeight: 600 }}>{p.codigo}<br />{p.restaurante}</span></Popup>
                </CircleMarker>
              ))}
              {/* Restaurantes (rojo) */}
              {puntosRestaurante.map((p, i) => (
                <CircleMarker key={`r-${i}`} center={[p.lat, p.lng]} radius={9} pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.9, weight: 2 }}>
                  <Popup><span style={{ fontSize: 12, fontWeight: 600 }}>{p.nombre}</span></Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🗺️</span>
                Sin entregas en este periodo
              </div>
            </div>
          )}
        </div>
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
