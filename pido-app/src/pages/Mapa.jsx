import { useState, useEffect, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, CircleF } from '@react-google-maps/api'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getCurrentPosition } from '../lib/geolocation'

const mapContainerStyle = { width: '100%', height: 'calc(100vh - 160px)', borderRadius: 16 }

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#252525' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
]

export default function Mapa({ onOpenRest }) {
  const { perfil } = useAuth()
  const [establecimientos, setEstablecimientos] = useState([])
  const [sociosActivos, setSociosActivos] = useState([])
  const [center, setCenter] = useState({ lat: 28.1235, lng: -15.4363 }) // Canarias por defecto
  const [selectedEst, setSelectedEst] = useState(null)
  const [selectedRider, setSelectedRider] = useState(null)
  const [map, setMap] = useState(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  useEffect(() => {
    fetchData()
    // Ubicación del usuario
    if (perfil?.latitud && perfil?.longitud) {
      setCenter({ lat: perfil.latitud, lng: perfil.longitud })
    } else {
      getCurrentPosition()
        .then(pos => setCenter({ lat: pos.lat, lng: pos.lng }))
        .catch(() => {})
    }
  }, [])

  // Realtime: posición de riders
  useEffect(() => {
    const channel = supabase.channel('mapa-riders')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'socios',
      }, payload => {
        setSociosActivos(prev =>
          prev.map(s => s.id === payload.new.id
            ? { ...s, latitud_actual: payload.new.latitud_actual, longitud_actual: payload.new.longitud_actual, en_servicio: payload.new.en_servicio }
            : s
          ).filter(s => s.en_servicio)
        )
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchData() {
    const [estRes, socRes] = await Promise.all([
      supabase.from('establecimientos').select('id, nombre, latitud, longitud, tipo, logo_url, rating, radio_cobertura_km').eq('activo', true),
      supabase.from('socios').select('id, nombre, latitud_actual, longitud_actual, rating, nombre_comercial').eq('en_servicio', true).not('latitud_actual', 'is', null),
    ])
    setEstablecimientos(estRes.data || [])
    setSociosActivos(socRes.data || [])
  }

  const onLoad = useCallback(m => setMap(m), [])

  if (!isLoaded) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)', margin: '0 0 16px' }}>Mapa</h2>
        <div style={{ height: 300, borderRadius: 16, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--c-muted)', fontSize: 13 }}>Cargando mapa...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Contadores flotantes */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--c-border)', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: 'var(--c-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>🍽️</span> {establecimientos.length} establecimientos
        </div>
        <div style={{ background: 'rgba(255,107,44,0.12)', border: '1px solid rgba(255,107,44,0.25)', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: 'var(--c-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>🛵</span> {sociosActivos.length} riders activos
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        onLoad={onLoad}
        options={{
          styles: darkMapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
        onClick={() => { setSelectedEst(null); setSelectedRider(null) }}
      >
        {/* Ubicación del usuario */}
        <MarkerF
          position={center}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          }}
        />
        <CircleF
          center={center}
          radius={150}
          options={{ fillColor: '#4285F4', fillOpacity: 0.1, strokeColor: '#4285F4', strokeOpacity: 0.3, strokeWeight: 1 }}
        />

        {/* Establecimientos */}
        {establecimientos.map(est => (
          est.latitud && est.longitud && (
            <MarkerF
              key={`est-${est.id}`}
              position={{ lat: est.latitud, lng: est.longitud }}
              onClick={() => { setSelectedEst(est); setSelectedRider(null) }}
              icon={{
                url: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><circle cx="18" cy="18" r="16" fill="#1A1A1A" stroke="#FF6B2C" stroke-width="2.5"/><text x="18" y="23" text-anchor="middle" font-size="16">${est.tipo === 'restaurante' ? '🍽️' : '🏪'}</text></svg>`)}`,
                scaledSize: new window.google.maps.Size(36, 36),
              }}
            />
          )
        ))}

        {/* Riders activos */}
        {sociosActivos.map(rider => (
          rider.latitud_actual && rider.longitud_actual && (
            <MarkerF
              key={`rider-${rider.id}`}
              position={{ lat: rider.latitud_actual, lng: rider.longitud_actual }}
              onClick={() => { setSelectedRider(rider); setSelectedEst(null) }}
              icon={{
                url: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect x="2" y="2" width="36" height="36" rx="10" fill="#FF6B2C"/><text x="20" y="26" text-anchor="middle" font-size="18">🛵</text></svg>`)}`,
                scaledSize: new window.google.maps.Size(40, 40),
              }}
            />
          )
        ))}

        {/* InfoWindow establecimiento */}
        {selectedEst && (
          <InfoWindowF
            position={{ lat: selectedEst.latitud, lng: selectedEst.longitud }}
            onCloseClick={() => setSelectedEst(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -20) }}
          >
            <div style={{ fontFamily: "'DM Sans', sans-serif", padding: 4, minWidth: 160 }}
              onClick={() => onOpenRest && onOpenRest(selectedEst)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {selectedEst.logo_url ? (
                  <img src={selectedEst.logo_url} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 20 }}>{selectedEst.tipo === 'restaurante' ? '🍽️' : '🏪'}</span>
                )}
                <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1A1A' }}>{selectedEst.nombre}</div>
              </div>
              <div style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#FBBF24' }}>★</span> {selectedEst.rating || '—'}
                <span style={{ margin: '0 4px' }}>·</span>
                <span style={{ textTransform: 'capitalize' }}>{selectedEst.tipo}</span>
              </div>
              {onOpenRest && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#FF6B2C', fontWeight: 700, cursor: 'pointer' }}>
                  Ver carta →
                </div>
              )}
            </div>
          </InfoWindowF>
        )}

        {/* InfoWindow rider */}
        {selectedRider && (
          <InfoWindowF
            position={{ lat: selectedRider.latitud_actual, lng: selectedRider.longitud_actual }}
            onCloseClick={() => setSelectedRider(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -22) }}
          >
            <div style={{ fontFamily: "'DM Sans', sans-serif", padding: 4, minWidth: 140 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1A1A', marginBottom: 2 }}>
                🛵 {selectedRider.nombre}
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>
                {selectedRider.nombre_comercial}
              </div>
              <div style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span style={{ color: '#FBBF24' }}>★</span> {selectedRider.rating || '—'}
                <span style={{ width: 6, height: 6, borderRadius: 3, background: '#16A34A', display: 'inline-block', marginLeft: 4 }} />
                <span style={{ color: '#16A34A', fontWeight: 600 }}>Activo</span>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  )
}
