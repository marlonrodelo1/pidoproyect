import { useState, useEffect } from 'react'
import { MapPin, Search, X, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getCurrentPosition } from '../lib/geolocation'
import Stars from '../components/Stars'
import EntregaBadge from '../components/EntregaBadge'

const CATEGORIAS_EMOJI = [
  { nombre: 'Pizzas', emoji: '🍕' },
  { nombre: 'Burgers', emoji: '🍔' },
  { nombre: 'Sushi', emoji: '🍣' },
  { nombre: 'Postres', emoji: '🍰' },
  { nombre: 'Bebidas', emoji: '🥤' },
  { nombre: 'Latina', emoji: '🫓' },
]

export default function Home({ onOpenRest, categoriaPadre, onSerSocio }) {
  const { perfil } = useAuth()
  const [establecimientos, setEstablecimientos] = useState([])
  const [ridersActivos, setRidersActivos] = useState({}) // {establecimiento_id: true/false}
  const [busqueda, setBusqueda] = useState('')
  const [catActiva, setCatActiva] = useState(null)
  const [favoritos, setFavoritos] = useState(perfil?.favoritos || [])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    // Pedir geolocalización al montar
    getCurrentPosition()
      .then(pos => setUserLocation(pos))
      .catch(() => {})
    fetchEstablecimientos()
  }, [categoriaPadre])

  async function fetchEstablecimientos() {
    setLoading(true)
    let query = supabase
      .from('establecimientos')
      .select('*')
      .eq('activo', true)

    if (categoriaPadre) {
      query = query.eq('categoria_padre', categoriaPadre)
    }

    const { data } = await query.order('rating', { ascending: false })
    setEstablecimientos(data || [])

    // Cargar riders activos por establecimiento
    if (data && data.length > 0) {
      const estIds = data.map(e => e.id)
      // Obtener todas las relaciones aceptadas
      const { data: relaciones } = await supabase
        .from('socio_establecimiento')
        .select('establecimiento_id, socio_id')
        .in('establecimiento_id', estIds)
        .eq('estado', 'aceptado')

      if (relaciones && relaciones.length > 0) {
        // Obtener socios que estan en servicio
        const socioIds = [...new Set(relaciones.map(r => r.socio_id))]
        const { data: sociosActivos } = await supabase
          .from('socios')
          .select('id')
          .in('id', socioIds)
          .eq('activo', true)
          .eq('en_servicio', true)

        const sociosActivosSet = new Set((sociosActivos || []).map(s => s.id))
        const mapa = {}
        relaciones.forEach(r => {
          if (sociosActivosSet.has(r.socio_id)) mapa[r.establecimiento_id] = true
        })
        setRidersActivos(mapa)
      }
    }

    setLoading(false)
  }

  async function toggleFav(id) {
    const newFavs = favoritos.includes(id)
      ? favoritos.filter(x => x !== id)
      : [...favoritos, id]
    setFavoritos(newFavs)

    if (perfil) {
      await supabase.from('usuarios').update({ favoritos: newFavs }).eq('id', perfil.id)
    }
  }

  const filtrados = establecimientos.filter(r => {
    if (busqueda && !r.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  const destacados = establecimientos.filter(r => r.rating >= 4.5).slice(0, 5)

  return (
    <div>
      {/* Dirección */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <MapPin size={16} strokeWidth={2.5} color="var(--c-primary)" />
        <div>
          <div style={{ fontSize: 10, color: 'var(--c-muted)', fontWeight: 600 }}>Entregar en</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)' }}>{perfil?.direccion || 'Configura tu dirección'}</div>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--c-surface)', borderRadius: 14, padding: '12px 16px', border: '1px solid var(--c-border)', marginBottom: 20 }}>
        <Search size={18} strokeWidth={1.8} color="var(--c-muted)" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar restaurante o plato..."
          style={{ border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', background: 'transparent', flex: 1, color: 'var(--c-text)' }} />
        {busqueda && <button onClick={() => setBusqueda('')} style={{ background: 'var(--c-surface2)', border: 'none', borderRadius: 50, width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} color="var(--c-muted)" /></button>}
      </div>

      {/* Categorías */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
        {CATEGORIAS_EMOJI.map(c => (
          <button key={c.nombre} onClick={() => setCatActiva(catActiva === c.nombre ? null : c.nombre)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: 56,
            opacity: catActiva && catActiva !== c.nombre ? 0.4 : 1, transition: 'opacity 0.2s',
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14,
              background: catActiva === c.nombre ? 'var(--c-primary)' : 'var(--c-surface)',
              border: catActiva === c.nombre ? 'none' : '1px solid var(--c-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'all 0.2s',
            }}>{c.emoji}</div>
            <span style={{ fontSize: 10, fontWeight: 600, color: catActiva === c.nombre ? 'var(--c-primary)' : 'var(--c-muted)' }}>{c.nombre}</span>
          </button>
        ))}
      </div>

      {/* Destacados slider */}
      {!busqueda && !catActiva && destacados.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-text)', marginBottom: 12 }}>Destacados</h2>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {destacados.map(r => (
              <div key={r.id} onClick={() => onOpenRest(r)} style={{
                minWidth: 240, flexShrink: 0, background: 'var(--c-surface)', borderRadius: 16,
                overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--c-border)',
              }}>
                <div style={{
                  height: 100, background: r.banner_url ? `url(${r.banner_url}) center/cover` : 'linear-gradient(135deg, var(--c-primary-light), var(--c-primary-soft))',
                  position: 'relative',
                }}>
                  <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--c-primary)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 6 }}>Destacado</span>
                </div>
                <div style={{ position: 'relative', padding: '0 12px' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 11, border: '3px solid #fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--c-surface)', fontSize: 18,
                    position: 'absolute', top: -21, left: 12,
                  }}>
                    {r.logo_url ? <img src={r.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
                  </div>
                </div>
                <div style={{ padding: '26px 14px 10px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)', marginBottom: 2 }}>{r.nombre}</div>
                  <div style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--c-muted)', alignItems: 'center' }}>
                    <Stars rating={r.rating} size={10} />
                    <span>{r.rating?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banner ser socio */}
      {!busqueda && !catActiva && onSerSocio && (
        <button onClick={onSerSocio} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(135deg, #FF6B2C 0%, #FF8F5E 100%)',
          borderRadius: 16, padding: '14px 18px', border: 'none', cursor: 'pointer',
          marginBottom: 24, textAlign: 'left', fontFamily: 'inherit',
        }}>
          <span style={{ fontSize: 28 }}>🛵</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Gana dinero repartiendo con pidoo</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Hasta 1.500EUR/mes · Registrate gratis</div>
          </div>
          <ChevronRight size={16} strokeWidth={2.5} color="#fff" />
        </button>
      )}

      {/* Lista */}
      <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-text)', marginBottom: 12 }}>
        {busqueda ? 'Resultados' : catActiva ? 'Restaurantes' : 'Cerca de ti'}
      </h2>

      {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-muted)' }}>Cargando...</div>}

      {!loading && filtrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No hay resultados</div>
        </div>
      )}

      {filtrados.map(r => {
        const isFav = favoritos.includes(r.id)
        return (
          <div key={r.id} onClick={() => onOpenRest(r)} style={{
            background: 'var(--c-surface)', borderRadius: 16, overflow: 'hidden',
            marginBottom: 14, cursor: 'pointer', border: '1px solid var(--c-border)',
          }}>
            {/* Banner sin logo */}
            <div style={{
              height: 130,
              background: r.banner_url ? `url(${r.banner_url}) center/cover` : 'linear-gradient(135deg, var(--c-primary-light), var(--c-primary-soft))',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', bottom: 8, right: 10, display: 'flex', gap: 6 }}>
                <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
                  {r.radio_cobertura_km} km
                </span>
              </div>
              <button onClick={e => { e.stopPropagation(); toggleFav(r.id) }} style={{
                position: 'absolute', top: 8, right: 8,
                width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.9)',
                border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}>
                {isFav ? '❤️' : '🤍'}
              </button>
            </div>
            {/* Logo mitad fuera mitad dentro */}
            <div style={{ position: 'relative', padding: '0 16px' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, border: '3px solid #fff',
                boxShadow: '0 2px 10px rgba(0,0,0,0.12)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--c-surface)', fontSize: 24,
                position: 'absolute', top: -26, left: 16,
              }}>
                {r.logo_url ? <img src={r.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
              </div>
            </div>
            {/* Info */}
            <div style={{ padding: '32px 16px 12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nombre}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Stars rating={r.rating} size={12} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text)' }}>{r.rating?.toFixed(1)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--c-muted)' }}>
                <span>{r.total_resenas} resenas</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {ridersActivos[r.id] && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: 'var(--c-primary-light)', color: 'var(--c-primary)', backdropFilter: 'blur(4px)' }}>Delivery</span>
                  )}
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: 'var(--c-surface2)', color: 'var(--c-muted)' }}>Recogida</span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
