import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ds } from '../lib/darkStyles'
import { CheckCircle, XCircle, FileText, Eye } from 'lucide-react'

export default function Socios() {
  const [items, setItems] = useState([])
  const [buscar, setBuscar] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [detalle, setDetalle] = useState(null)
  const [solicitudes, setSolicitudes] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('socios').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setSolicitudes((data || []).filter(s => !s.activo && !s.rechazado))
  }

  async function toggleActivo(id, activo) {
    await supabase.from('socios').update({ activo: !activo }).eq('id', id)
    load()
  }

  async function aceptarSocio(id) {
    await supabase.from('socios').update({ activo: true }).eq('id', id)
    load()
  }

  async function rechazarSocio(id) {
    await supabase.from('socios').update({ activo: false, rechazado: true }).eq('id', id)
    load()
  }

  const filtrados = items.filter(s => {
    if (filtro === 'activos' && !s.activo) return false
    if (filtro === 'inactivos' && s.activo) return false
    if (filtro === 'en_servicio' && !s.en_servicio) return false
    if (buscar && !s.nombre.toLowerCase().includes(buscar.toLowerCase()) && !s.nombre_comercial?.toLowerCase().includes(buscar.toLowerCase())) return false
    return true
  })

  if (detalle) {
    return (
      <div>
        <button onClick={() => setDetalle(null)} style={ds.backBtn}>← Volver</button>
        <div style={{ ...ds.card, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: '#FF5733', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', overflow: 'hidden' }}>
              {detalle.logo_url ? <img src={detalle.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : detalle.nombre_comercial?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F5F5F5' }}>{detalle.nombre}</h2>
              <div style={{ fontSize: 12, ...ds.muted }}>{detalle.nombre_comercial} · /{detalle.slug}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <span style={{ ...ds.badge, background: detalle.activo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: detalle.activo ? '#22C55E' : '#EF4444' }}>{detalle.activo ? 'Activo' : 'Inactivo'}</span>
              <span style={{ ...ds.badge, background: detalle.en_servicio ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.08)', color: detalle.en_servicio ? '#60A5FA' : 'rgba(255,255,255,0.4)' }}>{detalle.en_servicio ? 'En servicio' : 'Fuera'}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: '#F5F5F5' }}>
            <div><span style={ds.muted}>Email:</span> {detalle.email || '-'}</div>
            <div><span style={ds.muted}>Telefono:</span> {detalle.telefono || '-'}</div>
            <div><span style={ds.muted}>Modo entrega:</span> {detalle.modo_entrega}</div>
            <div><span style={ds.muted}>Radio:</span> {detalle.radio_km} km</div>
            <div><span style={ds.muted}>Rating:</span> {detalle.rating?.toFixed(1)} ({detalle.total_resenas} reseñas)</div>
            <div><span style={ds.muted}>Creado:</span> {new Date(detalle.created_at).toLocaleDateString('es-ES')}</div>
          </div>

          {/* Documentación */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F5', marginBottom: 10 }}>Documentación</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['DNI / NIE', 'Permiso de conducir', 'Seguro vehículo', 'Alta autónomo'].map(doc => (
                <div key={doc} style={{ ...ds.card, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={14} color="rgba(255,255,255,0.4)" />
                  <span style={{ fontSize: 12, color: '#F5F5F5', flex: 1 }}>{doc}</span>
                  <span style={{ ...ds.badge, background: 'rgba(245,158,11,0.15)', color: '#FBBF24' }}>Pendiente</span>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          {!detalle.activo && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => { aceptarSocio(detalle.id); setDetalle({ ...detalle, activo: true }) }} style={{ ...ds.primaryBtn, background: '#16A34A', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <CheckCircle size={16} /> Aceptar socio
              </button>
              <button onClick={() => { rechazarSocio(detalle.id); setDetalle(null) }} style={{ ...ds.primaryBtn, background: '#EF4444', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <XCircle size={16} /> Rechazar
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={ds.h1}>Socios / Riders</h1>
        <span style={{ fontSize: 13, ...ds.muted, fontWeight: 600 }}>{filtrados.length} total</span>
      </div>

      {/* Solicitudes pendientes */}
      {solicitudes.length > 0 && (
        <div style={{ ...ds.card, marginBottom: 20, borderColor: 'rgba(245,158,11,0.3)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FBBF24', marginBottom: 12 }}>
            📋 {solicitudes.length} solicitud{solicitudes.length > 1 ? 'es' : ''} pendiente{solicitudes.length > 1 ? 's' : ''}
          </div>
          {solicitudes.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FF5733', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                {s.nombre_comercial?.[0]?.toUpperCase() || 'S'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#F5F5F5' }}>{s.nombre}</div>
                <div style={{ fontSize: 11, ...ds.muted }}>{s.nombre_comercial} · {s.email}</div>
              </div>
              <button onClick={() => setDetalle(s)} style={{ ...ds.actionBtn, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Eye size={12} /> Revisar
              </button>
              <button onClick={() => aceptarSocio(s.id)} style={{ ...ds.actionBtn, color: '#22C55E' }}>Aceptar</button>
              <button onClick={() => rechazarSocio(s.id)} style={{ ...ds.actionBtn, color: '#EF4444' }}>Rechazar</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input placeholder="Buscar por nombre..." value={buscar} onChange={e => setBuscar(e.target.value)} style={ds.input} />
        <div style={{ display: 'flex', gap: 4 }}>
          {['todos', 'activos', 'inactivos', 'en_servicio'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{ ...ds.filterBtn, background: filtro === f ? '#FF6B2C' : 'rgba(255,255,255,0.08)', color: filtro === f ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              {f === 'todos' ? 'Todos' : f === 'activos' ? 'Activos' : f === 'inactivos' ? 'Inactivos' : 'En servicio'}
            </button>
          ))}
        </div>
      </div>

      <div style={ds.table}>
        <div style={ds.tableHeader}>
          <span style={{ width: 44 }}></span>
          <span style={{ flex: 1 }}>Nombre</span>
          <span style={{ width: 120 }}>Comercial</span>
          <span style={{ width: 80 }}>Modo</span>
          <span style={{ width: 60 }}>Rating</span>
          <span style={{ width: 80 }}>Estado</span>
          <span style={{ width: 120 }}>Acciones</span>
        </div>
        {filtrados.map(s => (
          <div key={s.id} style={ds.tableRow}>
            <span style={{ width: 44 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FF5733', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden' }}>
                {s.logo_url ? <img src={s.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.nombre_comercial?.[0]?.toUpperCase()}
              </div>
            </span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#F5F5F5' }} onClick={() => setDetalle(s)}>{s.nombre}</span>
            <span style={{ width: 120, fontSize: 12, ...ds.muted }}>{s.nombre_comercial}</span>
            <span style={{ width: 80 }}><span style={{ ...ds.badge, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{s.modo_entrega}</span></span>
            <span style={{ width: 60, fontSize: 12, color: '#F5F5F5' }}>{s.rating?.toFixed(1)}</span>
            <span style={{ width: 80 }}>
              <span style={{ ...ds.badge, background: s.activo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: s.activo ? '#22C55E' : '#EF4444' }}>{s.activo ? 'Activo' : 'Inactivo'}</span>
            </span>
            <span style={{ width: 120, display: 'flex', gap: 6 }}>
              <button onClick={() => setDetalle(s)} style={ds.actionBtn}>Ver</button>
              <button onClick={() => toggleActivo(s.id, s.activo)} style={{ ...ds.actionBtn, color: s.activo ? '#EF4444' : '#22C55E' }}>
                {s.activo ? 'Desactivar' : 'Activar'}
              </button>
            </span>
          </div>
        ))}
        {filtrados.length === 0 && <div style={{ padding: 32, textAlign: 'center', ...ds.muted, fontSize: 13 }}>Sin socios</div>}
      </div>
    </div>
  )
}
