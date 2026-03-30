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
  const [extrasAsignados, setExtrasAsignados] = useState([]) // IDs de grupos asignados al producto
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
    setExtrasAsignados([])
    setShowAddProd(true)
  }

  async function abrirEditarProducto(p) {
    setProdForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, categoria_id: p.categoria_id || '', imagen_url: p.imagen_url || '' })
    setEditProd(p)
    // Cargar extras asignados a este producto
    const { data } = await supabase.from('producto_extras').select('grupo_id').eq('producto_id', p.id)
    setExtrasAsignados((data || []).map(d => d.grupo_id))
    setShowAddProd(true)
  }

  function toggleExtraAsignado(grupoId) {
    setExtrasAsignados(prev =>
      prev.includes(grupoId) ? prev.filter(id => id !== grupoId) : [...prev, grupoId]
    )
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
    let productoId
    if (editProd) {
      await supabase.from('productos').update(data).eq('id', editProd.id)
      productoId = editProd.id
    } else {
      const { data: nuevo } = await supabase.from('productos').insert(data).select().single()
      productoId = nuevo?.id
    }
    // Guardar extras asignados
    if (productoId) {
      await supabase.from('producto_extras').delete().eq('producto_id', productoId)
      if (extrasAsignados.length > 0) {
        await supabase.from('producto_extras').insert(
          extrasAsignados.map(grupoId => ({ producto_id: productoId, grupo_id: grupoId }))
        )
      }
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

  // --- CRUD Extras ---
  const [editGrupo, setEditGrupo] = useState(null) // null = lista, 'new' = crear, objeto = editar
  const [grupoForm, setGrupoForm] = useState({ nombre: '', tipo: 'multiple', max_selecciones: 3 })
  const [opcionesForm, setOpcionesForm] = useState([]) // [{nombre, precio}]
  const [savingGrupo, setSavingGrupo] = useState(false)

  function abrirCrearGrupo() {
    setGrupoForm({ nombre: '', tipo: 'multiple', max_selecciones: 3 })
    setOpcionesForm([{ nombre: '', precio: '' }])
    setEditGrupo('new')
  }

  function abrirEditarGrupo(g) {
    setGrupoForm({ nombre: g.nombre, tipo: g.tipo, max_selecciones: g.max_selecciones })
    setOpcionesForm((g.extras_opciones || []).map(o => ({ id: o.id, nombre: o.nombre, precio: o.precio })))
    setEditGrupo(g)
  }

  async function guardarGrupo() {
    if (!grupoForm.nombre.trim()) return
    const opcionesValidas = opcionesForm.filter(o => o.nombre.trim() && o.precio !== '' && Number(o.precio) >= 0)
    if (opcionesValidas.length === 0) return
    setSavingGrupo(true)

    let grupoId
    if (editGrupo === 'new') {
      const { data } = await supabase.from('grupos_extras').insert({
        establecimiento_id: restaurante.id,
        nombre: grupoForm.nombre.trim(),
        tipo: grupoForm.tipo,
        max_selecciones: grupoForm.tipo === 'single' ? 1 : Number(grupoForm.max_selecciones),
      }).select().single()
      grupoId = data?.id
    } else {
      await supabase.from('grupos_extras').update({
        nombre: grupoForm.nombre.trim(),
        tipo: grupoForm.tipo,
        max_selecciones: grupoForm.tipo === 'single' ? 1 : Number(grupoForm.max_selecciones),
      }).eq('id', editGrupo.id)
      grupoId = editGrupo.id
      // Eliminar opciones antiguas
      await supabase.from('extras_opciones').delete().eq('grupo_id', grupoId)
    }

    if (grupoId) {
      await supabase.from('extras_opciones').insert(
        opcionesValidas.map((o, i) => ({ grupo_id: grupoId, nombre: o.nombre.trim(), precio: Number(o.precio), orden: i }))
      )
    }

    setSavingGrupo(false)
    setEditGrupo(null)
    fetchCarta()
  }

  async function eliminarGrupo(id) {
    if (!confirm('¿Eliminar este grupo de extras y todas sus opciones?')) return
    await supabase.from('extras_opciones').delete().eq('grupo_id', id)
    await supabase.from('producto_extras').delete().eq('grupo_id', id)
    await supabase.from('grupos_extras').delete().eq('id', id)
    fetchCarta()
  }

  if (gestionExtras) {
    // Formulario crear/editar grupo
    if (editGrupo) {
      return (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <button onClick={() => setEditGrupo(null)} style={s.backBtn}>← Volver a extras</button>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>{editGrupo === 'new' ? 'Nuevo grupo de extras' : 'Editar grupo'}</h2>

          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Nombre del grupo *</label>
            <input value={grupoForm.nombre} onChange={e => setGrupoForm({ ...grupoForm, nombre: e.target.value })} placeholder="Ej: Extras de queso" style={s.formInput} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Tipo de selección</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ id: 'single', l: 'Elige 1' }, { id: 'multiple', l: 'Múltiple' }].map(t => (
                <button key={t.id} onClick={() => setGrupoForm({ ...grupoForm, tipo: t.id })} style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                  border: grupoForm.tipo === t.id ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
                  background: grupoForm.tipo === t.id ? 'rgba(185,28,28,0.12)' : 'var(--c-surface)',
                  color: grupoForm.tipo === t.id ? 'var(--c-primary)' : 'var(--c-text)',
                }}>{t.l}</button>
              ))}
            </div>
          </div>

          {grupoForm.tipo === 'multiple' && (
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Máximo de selecciones</label>
              <input type="number" min="1" max="10" value={grupoForm.max_selecciones} onChange={e => setGrupoForm({ ...grupoForm, max_selecciones: e.target.value })} style={{ ...s.formInput, width: 80 }} />
            </div>
          )}

          <div style={{ marginBottom: 8 }}>
            <label style={s.label}>Opciones *</label>
          </div>
          {opcionesForm.map((op, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input value={op.nombre} onChange={e => { const n = [...opcionesForm]; n[i].nombre = e.target.value; setOpcionesForm(n) }} placeholder="Nombre" style={{ ...s.formInput, flex: 2 }} />
              <input type="number" step="0.10" value={op.precio} onChange={e => { const n = [...opcionesForm]; n[i].precio = e.target.value; setOpcionesForm(n) }} placeholder="€" style={{ ...s.formInput, flex: 1 }} />
              <button onClick={() => setOpcionesForm(prev => prev.filter((_, idx) => idx !== i))} style={{ width: 32, height: 38, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>×</button>
            </div>
          ))}
          <button onClick={() => setOpcionesForm(prev => [...prev, { nombre: '', precio: '' }])} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: '1px dashed var(--c-border)', background: 'transparent', color: 'var(--c-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
            + Añadir opción
          </button>

          <button onClick={guardarGrupo} disabled={savingGrupo || !grupoForm.nombre.trim() || opcionesForm.filter(o => o.nombre.trim() && o.precio !== '').length === 0} style={{
            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
            background: savingGrupo ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff',
            fontSize: 15, fontWeight: 800, cursor: savingGrupo ? 'default' : 'pointer', fontFamily: 'inherit',
          }}>
            {savingGrupo ? 'Guardando...' : editGrupo === 'new' ? 'Crear grupo' : 'Guardar cambios'}
          </button>
        </div>
      )
    }

    // Lista de grupos
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <button onClick={() => setGestionExtras(false)} style={s.backBtn}>← Volver a carta</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Grupos de extras</h2>
          <button onClick={abrirCrearGrupo} style={s.btnPrimary}>+ Grupo</button>
        </div>
        {gruposExtras.map(g => (
          <div key={g.id} style={{ ...s.card, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{g.nombre}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => abrirEditarGrupo(g)} style={s.miniBtn}>Editar</button>
                <button onClick={() => eliminarGrupo(g.id)} style={{ ...s.miniBtn, color: '#EF4444' }}>Eliminar</button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 10 }}>{g.tipo === 'multiple' ? `Múltiple · máx. ${g.max_selecciones}` : 'Selección única'}</div>
            {(g.extras_opciones || []).map(op => (
              <div key={op.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--c-border)', fontSize: 13 }}>
                <span>{op.nombre}</span>
                <span style={{ fontWeight: 700, color: 'var(--c-primary)' }}>+{op.precio.toFixed(2)} €</span>
              </div>
            ))}
          </div>
        ))}
        {gruposExtras.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: 'var(--c-muted)', fontSize: 13 }}>Sin extras configurados. Pulsa "+ Grupo" para crear uno.</div>}
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

            {/* Extras asignados */}
            {gruposExtras.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Grupos de extras</label>
                <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 10 }}>Selecciona qué extras puede elegir el cliente para este producto.</p>
                {gruposExtras.map(g => {
                  const activo = extrasAsignados.includes(g.id)
                  return (
                    <button key={g.id} onClick={() => toggleExtraAsignado(g.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
                      borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 6,
                      border: activo ? '2px solid var(--c-primary)' : '1px solid rgba(255,255,255,0.1)',
                      background: activo ? 'rgba(185,28,28,0.12)' : 'rgba(255,255,255,0.04)',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, border: activo ? 'none' : '2px solid rgba(255,255,255,0.2)',
                        background: activo ? 'var(--c-primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        fontSize: 12, color: '#fff',
                      }}>
                        {activo && '✓'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#F5F5F5' }}>{g.nombre}</div>
                        <div style={{ fontSize: 10, color: 'var(--c-muted)' }}>
                          {g.tipo === 'single' ? 'Elige 1' : `Máx. ${g.max_selecciones}`} · {(g.extras_opciones || []).map(o => o.nombre).join(', ')}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

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
