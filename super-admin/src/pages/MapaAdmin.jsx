import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ds } from '../lib/darkStyles'
import { RefreshCw } from 'lucide-react'

export default function MapaAdmin() {
  const [riders, setRiders] = useState([])
  const [establecimientos, setEstablecimientos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const [ridersRes, estRes] = await Promise.all([
      supabase.from('socios').select('id, nombre, nombre_comercial, latitud_actual, longitud_actual, en_servicio, rating').eq('activo', true),
      supabase.from('establecimientos').select('id, nombre, latitud, longitud, tipo').eq('activo', true),
    ])
    setRiders(ridersRes.data || [])
    setEstablecimientos(estRes.data || [])
    setLoading(false)
  }

  const enServicio = riders.filter(r => r.en_servicio)
  const fuera = riders.filter(r => !r.en_servicio)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={ds.h1}>Mapa en vivo</h1>
        <button onClick={loadData} style={{ ...ds.secondaryBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={ds.card}>
          <div style={{ fontSize: 11, ...ds.muted, fontWeight: 600 }}>Riders activos</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#22C55E' }}>{enServicio.length}</div>
        </div>
        <div style={ds.card}>
          <div style={{ fontSize: 11, ...ds.muted, fontWeight: 600 }}>Riders fuera</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{fuera.length}</div>
        </div>
        <div style={ds.card}>
          <div style={{ fontSize: 11, ...ds.muted, fontWeight: 600 }}>Establecimientos</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#FF6B2C' }}>{establecimientos.length}</div>
        </div>
      </div>

      {/* Mapa visual */}
      <div style={{
        height: 400, borderRadius: 16, background: 'linear-gradient(135deg, rgba(30,58,95,0.3), rgba(15,30,50,0.5))',
        position: 'relative', overflow: 'hidden', marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 60, opacity: 0.1 }}>🗺️</span>
        </div>

        {/* Establecimientos */}
        {establecimientos.slice(0, 8).map((e, i) => (
          <div key={e.id} style={{
            position: 'absolute', top: `${15 + (i * 19) % 65}%`, left: `${10 + (i * 23) % 75}%`,
            background: 'rgba(255,107,44,0.2)', borderRadius: 8, padding: '4px 8px',
            display: 'flex', alignItems: 'center', gap: 4, border: '1px solid rgba(255,107,44,0.3)',
          }}>
            <span style={{ fontSize: 12 }}>{e.tipo === 'restaurante' ? '🍽️' : '🏪'}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#FF6B2C' }}>{e.nombre.substring(0, 12)}</span>
          </div>
        ))}

        {/* Riders activos */}
        {enServicio.map((r, i) => (
          <div key={r.id} style={{
            position: 'absolute', top: `${25 + i * 18}%`, left: `${20 + i * 22}%`,
            background: '#22C55E', borderRadius: 10, padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: '0 2px 12px rgba(34,197,94,0.4)', animation: 'pulse 2s infinite',
          }}>
            <span style={{ fontSize: 12 }}>🛵</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{r.nombre.split(' ')[0]}</span>
          </div>
        ))}

        <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: '#22C55E' }} />
            <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>Riders ({enServicio.length})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: '#FF6B2C' }} />
            <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>Establecimientos ({establecimientos.length})</span>
          </div>
        </div>

        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '6px 10px', fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
          Actualización cada 10s
        </div>
      </div>

      {/* Lista de riders */}
      <h2 style={ds.h2}>Riders activos</h2>
      {enServicio.length === 0 && (
        <div style={{ ...ds.card, textAlign: 'center', padding: 32, ...ds.muted, fontSize: 13 }}>No hay riders activos en este momento</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {enServicio.map(r => (
          <div key={r.id} style={{ ...ds.card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FF5733', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛵</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#F5F5F5' }}>{r.nombre}</div>
              <div style={{ fontSize: 11, ...ds.muted }}>★ {r.rating?.toFixed(1)} · {r.nombre_comercial}</div>
            </div>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
