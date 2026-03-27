import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRest } from '../context/RestContext'

export default function Carta() {
  const { restaurante } = useRest()
  const [categoriasGenerales, setCategoriasGenerales] = useState([])
  const [productos, setProductos] = useState([])
  const [gruposExtras, setGruposExtras] = useState([])
  const [catFiltro, setCatFiltro] = useState(null)
  const [gestionExtras, setGestionExtras] = useState(false)
  const [loading, setLoading] = useState(true)

  // Crear/editar producto
  const [showAddProd, setShowAddProd] = useState(false)
  const [editProd, setEditProd] = useState(null)
  const [prodForm, setProdForm] = useState({ nombre: '', descripcion: '', precio: '', categoria_id: '', imagen_url: '' })
  const [saving, setSaving] = useState(false)
  const imgRef = useRef()

  useEffect(() => { if (restaurante) fetchCarta() }, [restaurante?.id])

  async function fetchCarta() {
    setLoading(true)
    const [catRes, prodRes, grpRes] = await Promise.all([
      supabase.from('categorias_generales').select('*').eq('activa', true).order('orden'),
      supabase.from('productos').select('*').eq('establecimiento_id', restaurante.id).order('orden'),
      supabase.from('grupos_extras').select('*, extras_opciones(*)').eq('establecimiento_id', restaurante.id),
    ])
    setCategoriasGenerales(catRes.data || [])
    setProductos(prodRes.data || [])
    setGruposExtras(grpRes.data || [])
    setLoading(false)
  }

  async function toggleDisponible(id, current) {
    await supabase.from('productos').update({ disponible: !current }).eq('id', id)
    setProductos(prev => prev.map(p => p.id === id ? { ...p, disponible: !current } : p))
  }

  async function subirImagenProducto(file, productoId) {
    const ext = file.name.split('.').pop()
    const path = `${restaurante.id}/${productoId || 'new'}_${Date.now()}.${ext}`
    await supabase.storage.from('productos').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(path)
    if (productoId) {
      await supabase.from('productos').update({ imagen_url: publicUrl }).eq('id', productoId)
      setProductos(prev => prev.map(p => p.id === productoId ? { ...p, imagen_url: publicUrl } : p))
    }
    return publicUrl
  }

  // --- Productos ---
  function abrirCrearProducto() {
    setProdForm({ nombre: '', descripcion: '', precio: '', categoria_id: catFiltro || categoriasGenerales[0]?.id || '', imagen_url: '' })
    setEditProd(null)
    setShowAddProd(true)
  }

  function abrirEditarProducto(p) {
    setProdForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, categoria_id: p.categoria_id || '', imagen_url: p.imagen_url || '' })
    setEditProd(p)
    setShowAddProd(true)
  }

  async function guardarProducto() {
    if (!prodForm.nombre.trim() || !prodForm.precio) return
    setSaving(true)
    const data = {
      nombre: prodForm.nombre.trim(),
      descripcion: prodForm.descripcion.trim() || null,
      precio: Number(prodForm.precio),
      categoria_id: prodForm.categoria_id || null,
      imagen_url: prodForm.imagen_url || null,
      establecimiento_id: restaurante.id,
      disponible: true,
      orden: productos.length,
    }
    if (editProd) {
      await supabase.from('productos').update(data).eq('id', editProd.id)
    } else {
      await supabase.from('productos').insert(data)
    }
    setShowAddProd(false)
    setEditProd(null)
    setSaving(false)
    fetchCarta()
  }

  async function eliminarProducto(id) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('productos').delete().eq('id', id)
    fetchCarta()
  }

  async function handleImagenForm(file) {
    if (!file) return
    if (editProd) {
      const url = await subirImagenProducto(file, editProd.id)
      setProdForm(prev => ({ ...prev, imagen_url: url }))
    } else {
      const ext = file.name.split('.').pop()
      const path = `${restaurante.id}/temp_${Date.now()}.${ext}`
      await supabase.storage.from('productos').upload(path, file, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(path)
      setProdForm(prev => ({ ...prev, imagen_url: publicUrl }))
    }
  }

  // Filtrar productos por categoría seleccionada
  const filtrados = catFiltro ? productos.filter(p => p.categoria_id === catFiltro) : productos

  // Categorías que el restaurante usa (tienen al menos 1 producto)
  const catsUsadas = [...new Set(productos.map(p => p.categoria_id).filter(Boolean))]
  const catLabel = (id) => {
    const cat = categoriasGenerales.find(c => c.id === id)
    return cat ? `${cat.emoji} ${cat.nombre}` : 'Sin categoría'
  }

  // --- Extras ---
  if (gestionExtras) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <button onClick={() => setGestionExtras(false)} style={s.backBtn}>← Volver a carta</button>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>Grupos de extras</h2>
        {gruposExtras.map(g => (
          <div key={g.id} style={s.card}>
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
        {gruposExtras.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: 'var(--c-muted)', fontSize: 13 }}>Sin extras configurados</div>}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Mi carta</h2>
        <button onClick={abrirCrearProducto} style={s.btnPrimary}>+ Producto</button>
      </div>

      <button onClick={() => setGestionExtras(true)} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid var(--c-border)', background: 'var(--c-surface)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--c-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        Gestionar extras ({gruposExtras.length})
      </button>

      {/* Filtro por categorías */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
        <button onClick={() => setCatFiltro(null)} style={{ ...s.catBtn, background: !catFiltro ? 'var(--c-primary)' : 'var(--c-surface2)', color: !catFiltro ? '#fff' : 'var(--c-text)' }}>Todos ({productos.length})</button>
        {categoriasGenerales.filter(c => catsUsadas.includes(c.id)).map(c => (
          <button key={c.id} onClick={() => setCatFiltro(c.id)} style={{ ...s.catBtn, background: catFiltro === c.id ? 'var(--c-primary)' : 'var(--c-surface2)', color: catFiltro === c.id ? '#fff' : 'var(--c-text)' }}>
            {c.emoji} {c.nombre}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-muted)' }}>Cargando...</div>}

      {/* Lista productos */}
      {filtrados.map(p => (
        <div key={p.id} style={{ ...s.card, marginBottom: 10, opacity: p.disponible ? 1 : 0.5 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div onClick={() => { imgRef.current?.click(); setEditProd(p) }} style={{ width: 60, height: 60, borderRadius: 10, background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--c-muted)', flexShrink: 0, cursor: 'pointer', overflow: 'hidden' }}>
              {p.imagen_url ? <img src={p.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 14, cursor: 'pointer' }} onClick={() => abrirEditarProducto(p)}>{p.nombre}</span>
                <button onClick={() => toggleDisponible(p.id, p.disponible)} style={{
                  width: 42, height: 24, borderRadius: 12, border: 'none',
                  background: p.disponible ? '#16A34A' : 'rgba(255,255,255,0.15)',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}>
                  <span style={{ position: 'absolute', top: 2, left: p.disponible ? 20 : 2, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
              {p.categoria_id && <div style={{ fontSize: 10, color: 'var(--c-muted)', marginBottom: 2 }}>{catLabel(p.categoria_id)}</div>}
              {p.descripcion && <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>{p.descripcion}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--c-primary)' }}>{p.precio.toFixed(2)} €</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => abrirEditarProducto(p)} style={s.miniBtn}>Editar</button>
                  <button onClick={() => eliminarProducto(p.id)} style={{ ...s.miniBtn, color: '#EF4444' }}>Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {!loading && filtrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--c-muted)', fontSize: 13 }}>
          Sin productos. Pulsa "+ Producto" para añadir.
        </div>
      )}

      {/* Input oculto para subir imagen */}
      <input ref={imgRef} type="file" accept="image/*" hidden onChange={e => {
        if (e.target.files[0] && editProd) subirImagenProducto(e.target.files[0], editProd.id)
      }} />

      {/* Modal crear/editar producto */}
      {showAddProd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowAddProd(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1A1A1A', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 420, maxHeight: '80vh', overflowY: 'auto', animation: 'slideUp 0.3s ease', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#F5F5F5' }}>{editProd ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button onClick={() => setShowAddProd(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', fontSize: 18, cursor: 'pointer', color: '#F5F5F5', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>Categoría *</label>
              <select value={prodForm.categoria_id} onChange={e => setProdForm({ ...prodForm, categoria_id: e.target.value })} style={s.formInput}>
                <option value="">Sin categoría</option>
                {categoriasGenerales.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>Nombre *</label>
              <input value={prodForm.nombre} onChange={e => setProdForm({ ...prodForm, nombre: e.target.value })} placeholder="Ej: Pizza Margarita" style={s.formInput} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>Precio (€) *</label>
              <input type="number" step="0.01" value={prodForm.precio} onChange={e => setProdForm({ ...prodForm, precio: e.target.value })} placeholder="9.50" style={s.formInput} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>Descripción</label>
              <textarea value={prodForm.descripcion} onChange={e => setProdForm({ ...prodForm, descripcion: e.target.value })} placeholder="Descripción opcional..." rows={2} style={{ ...s.formInput, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Imagen</label>
              <label style={{ ...s.formInput, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                📷 {prodForm.imagen_url ? 'Imagen subida ✓' : 'Subir imagen del producto'}
                <input type="file" accept="image/*" hidden onChange={e => handleImagenForm(e.target.files[0])} />
              </label>
              {prodForm.imagen_url && <img src={prodForm.imagen_url} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', marginTop: 8 }} />}
            </div>

            <button onClick={guardarProducto} disabled={saving || !prodForm.nombre.trim() || !prodForm.precio} style={{
              width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
              background: saving ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff',
              fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
            }}>
              {saving ? 'Guardando...' : editProd ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  card: { background: 'var(--c-surface)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--c-border)' },
  backBtn: { background: 'none', border: 'none', color: 'var(--c-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0, fontFamily: 'inherit' },
  btnPrimary: { padding: '8px 14px', borderRadius: 10, border: 'none', background: 'var(--c-primary)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  catBtn: { padding: '7px 14px', borderRadius: 50, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  miniBtn: { padding: '3px 8px', borderRadius: 6, border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: 'var(--c-surface2)', color: 'var(--c-primary)' },
  formInput: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', fontSize: 13, fontFamily: 'inherit', background: 'rgba(255,255,255,0.06)', color: '#F5F5F5', outline: 'none', boxSizing: 'border-box' },
  label: { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 4, display: 'block' },
}
