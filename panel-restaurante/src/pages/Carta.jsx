import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRest } from '../context/RestContext'

export default function Carta() {
  const { restaurante } = useRest()
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [gruposExtras, setGruposExtras] = useState([])
  const [catFiltro, setCatFiltro] = useState(null)
  const [gestionExtras, setGestionExtras] = useState(false)
  const [loading, setLoading] = useState(true)
  const imgRef = useRef(null)

  useEffect(() => { if (restaurante) fetchCarta() }, [restaurante?.id])

  async function fetchCarta() {
    setLoading(true)
    const [catRes, prodRes, grpRes] = await Promise.all([
      supabase.from('categorias').select('*').eq('establecimiento_id', restaurante.id).order('orden'),
      supabase.from('productos').select('*').eq('establecimiento_id', restaurante.id).order('orden'),
      supabase.from('grupos_extras').select('*, extras_opciones(*)').eq('establecimiento_id', restaurante.id),
    ])
    setCategorias(catRes.data || [])
    setProductos(prodRes.data || [])
    setGruposExtras(grpRes.data || [])
    setLoading(false)
  }

  async function toggleDisponible(id, current) {
    await supabase.from('productos').update({ disponible: !current }).eq('id', id)
    setProductos(prev => prev.map(p => p.id === id ? { ...p, disponible: !current } : p))
  }

  async function subirImagen(file, productoId) {
    const ext = file.name.split('.').pop()
    const path = `${restaurante.id}/${productoId}.${ext}`
    await supabase.storage.from('productos').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(path)
    await supabase.from('productos').update({ imagen_url: publicUrl }).eq('id', productoId)
    setProductos(prev => prev.map(p => p.id === productoId ? { ...p, imagen_url: publicUrl } : p))
  }

  const filtrados = catFiltro ? productos.filter(p => p.categoria_id === catFiltro) : productos

  if (gestionExtras) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <button onClick={() => setGestionExtras(false)} style={{ background: 'none', border: 'none', color: 'var(--c-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0, fontFamily: 'inherit' }}>← Volver a carta</button>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>Grupos de extras</h2>
        {gruposExtras.map(g => (
          <div key={g.id} style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 16, border: '1px solid var(--c-border)', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{g.nombre}</div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 10 }}>{g.tipo === 'multiple' ? `Múltiple · máx. ${g.max_selecciones}` : 'Selección única'}</div>
            {(g.extras_opciones || []).map(op => (
              <div key={op.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--c-border)', fontSize: 13 }}>
                <span>{op.nombre}</span>
                <span style={{ fontWeight: 700, color: 'var(--c-primary)' }}>+{op.precio.toFixed(2)} €</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Mi carta</h2>
      </div>

      <button onClick={() => setGestionExtras(true)} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid var(--c-border)', background: 'var(--c-surface)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--c-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        Gestionar grupos de extras ({gruposExtras.length})
      </button>

      {/* Categorías */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
        <button onClick={() => setCatFiltro(null)} style={{ padding: '7px 14px', borderRadius: 50, border: 'none', background: !catFiltro ? 'var(--c-primary)' : 'var(--c-surface2)', color: !catFiltro ? '#fff' : 'var(--c-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Todos</button>
        {categorias.map(c => (
          <button key={c.id} onClick={() => setCatFiltro(c.id)} style={{ padding: '7px 14px', borderRadius: 50, border: 'none', background: catFiltro === c.id ? 'var(--c-primary)' : 'var(--c-surface2)', color: catFiltro === c.id ? '#fff' : 'var(--c-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: c.activa ? 1 : 0.5 }}>{c.nombre}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-muted)' }}>Cargando...</div>}

      {filtrados.map(p => (
        <div key={p.id} style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--c-border)', marginBottom: 10, opacity: p.disponible ? 1 : 0.5 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {p.imagen_url ? (
              <img src={p.imagen_url} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 60, height: 60, borderRadius: 10, background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--c-muted)', flexShrink: 0, cursor: 'pointer' }}>
                📷
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{p.nombre}</span>
                <button onClick={() => toggleDisponible(p.id, p.disponible)} style={{
                  width: 42, height: 24, borderRadius: 12, border: 'none',
                  background: p.disponible ? '#16A34A' : '#D1D5DB',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}>
                  <span style={{ position: 'absolute', top: 2, left: p.disponible ? 20 : 2, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
              {p.descripcion && <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>{p.descripcion}</div>}
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--c-primary)' }}>{p.precio.toFixed(2)} €</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
