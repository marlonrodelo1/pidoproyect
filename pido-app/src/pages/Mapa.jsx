import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Mapa() {
  const [establecimientos, setEstablecimientos] = useState([])
  const [sociosActivos, setSociosActivos] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [estRes, socRes] = await Promise.all([
      supabase.from('establecimientos').select('id, nombre, latitud, longitud, tipo').eq('activo', true),
      supabase.from('socios').select('id, nombre, latitud_actual, longitud_actual, rating').eq('en_servicio', true),
    ])
    setEstablecimientos(estRes.data || [])
    setSociosActivos(socRes.data || [])
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)', margin: '0 0 16px' }}>Mapa</h2>

      {/* Mapa placeholder - se reemplazará por Google Maps */}
      <div style={{ height: 300, borderRadius: 16, background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)', position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🗺️</div>

        {/* Restaurantes en mapa */}
        {establecimientos.slice(0, 6).map((r, i) => (
          <div key={r.id} style={{
            position: 'absolute',
            top: `${20 + (i * 17) % 60}%`,
            left: `${15 + (i * 23) % 70}%`,
            fontSize: 22,
          }}>
            {r.tipo === 'restaurante' ? '🍽️' : '🏪'}
          </div>
        ))}

        {/* Riders activos */}
        {sociosActivos.map((r, i) => (
          <div key={r.id} style={{
            position: 'absolute', top: `${30 + i * 15}%`, left: `${25 + i * 20}%`,
            background: 'var(--c-primary)', borderRadius: 8, padding: '3px 8px',
            display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <span style={{ fontSize: 12 }}>🛵</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{r.nombre.split(' ')[0]}</span>
          </div>
        ))}

        {/* Radio */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 200, height: 200, borderRadius: '50%', border: '2px dashed var(--c-primary)', opacity: 0.3 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 20 }}>📍</div>

        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontWeight: 600 }}>
          {establecimientos.length} establecimientos · {sociosActivos.length} riders activos
        </div>
      </div>

      {/* Lista riders */}
      <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text)', marginBottom: 10 }}>Riders activos</h3>
      {sociosActivos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--c-muted)', fontSize: 13 }}>No hay riders activos en este momento</div>
      )}
      {sociosActivos.map(r => (
        <div key={r.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--c-border)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛵</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)' }}>{r.nombre}</div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>★ {r.rating} · Activo</div>
          </div>
          <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: 4, background: '#16A34A', boxShadow: '0 0 6px rgba(22,163,74,0.5)' }} />
        </div>
      ))}
    </div>
  )
}
