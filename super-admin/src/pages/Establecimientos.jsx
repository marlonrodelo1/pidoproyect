import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ds } from '../lib/darkStyles'
import { Plus, X } from 'lucide-react'

const CATEGORIAS_PADRE = ['comida', 'farmacia', 'marketplace']

export default function Establecimientos() {
  const [items, setItems] = useState([])
  const [buscar, setBuscar] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [detalle, setDetalle] = useState(null)
  const [showCrear, setShowCrear] = useState(false)
  const [showAddCat, setShowAddCat] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState({ nombre: '', tipo: 'restaurante', categoria_padre: 'comida', email: '', telefono: '', direccion: '', radio_cobertura_km: 5, descripcion: '', banner_url: '', logo_url: '' })
  const [catForm, setCatForm] = useState({ nombre: '', orden: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('establecimientos').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  async function loadCategorias(estId) {
    const { data } = await supabase.from('categorias').select('*').eq('establecimiento_id', estId).order('orden')
    setCategorias(data || [])
  }

  async function toggleActivo(id, activo) {
    await supabase.from('establecimientos').update({ activo: !activo }).eq('id', id)
    load()
  }

  async function crearEstablecimiento() {
    setSaving(true)
    const { error } = await supabase.from('establecimientos').insert({ ...form, activo: true, rating: 0, total_resenas: 0 })
    if (error) alert('Error: ' + error.message)
    else { setShowCrear(false); setForm({ nombre: '', tipo: 'restaurante', categoria_padre: 'comida', email: '', telefono: '', direccion: '', radio_cobertura_km: 5, descripcion: '', banner_url: '', logo_url: '' }); load() }
    setSaving(false)
  }

  async function agregarCategoria() {
    if (!catForm.nombre.trim()) return
    await supabase.from('categorias').insert({ establecimiento_id: detalle.id, nombre: catForm.nombre.trim(), orden: catForm.orden, activa: true })
    setCatForm({ nombre: '', orden: 0 })
    loadCategorias(detalle.id)
  }

  async function eliminarCategoria(id) {
    await supabase.from('categorias').delete().eq('id', id)
    loadCategorias(detalle.id)
  }

  const filtrados = items.filter(e => {
    if (filtroTipo !== 'todos' && e.categoria_padre !== filtroTipo) return false
    if (buscar && !e.nombre.toLowerCase().includes(buscar.toLowerCase())) return false
    return true
  })

  const tipos = ['todos', ...CATEGORIAS_PADRE]

  if (detalle) {
    return (
      <div>
        <button onClick={() => setDetalle(null)} style={ds.backBtn}>← Volver</button>
        <div style={{ ...ds.card, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, overflow: 'hidden' }}>
              {detalle.logo_url ? <img src={detalle.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F5F5F5' }}>{detalle.nombre}</h2>
              <div style={{ fontSize: 12, ...ds.muted }}>{detalle.tipo} · {detalle.categoria_padre}</div>
            </div>
            <span style={{ ...ds.badge, marginLeft: 'auto', background: detalle.activo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: detalle.activo ? '#22C55E' : '#EF4444' }}>{detalle.activo ? 'Activo' : 'Inactivo'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: '#F5F5F5' }}>
            <div><span style={ds.muted}>Email:</span> {detalle.email || '-'}</div>
            <div><span style={ds.muted}>Telefono:</span> {detalle.telefono || '-'}</div>
            <div><span style={ds.muted}>Direccion:</span> {detalle.direccion || '-'}</div>
            <div><span style={ds.muted}>Radio:</span> {detalle.radio_cobertura_km} km</div>
            <div><span style={ds.muted}>Rating:</span> {detalle.rating?.toFixed(1)} ({detalle.total_resenas} resenas)</div>
            <div><span style={ds.muted}>Creado:</span> {new Date(detalle.created_at).toLocaleDateString('es-ES')}</div>
          </div>
        </div>

        {/* Categorías de la carta */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F5F5F5' }}>Categorías de la carta</h3>
            <button onClick={() => { setShowAddCat(true); loadCategorias(detalle.id) }} style={ds.primaryBtn}>
              <Plus size={14} style={{ marginRight: 4 }} /> Añadir
            </button>
          </div>
          {categorias.length === 0 && !showAddCat && (
            <button onClick={() => { setShowAddCat(true); loadCategorias(detalle.id) }} style={{ ...ds.card, width: '100%', textAlign: 'center', cursor: 'pointer', border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Sin categorías. Click para cargar o añadir.
            </button>
          )}
          {categorias.map(c => (
            <div key={c.id} style={{ ...ds.card, padding: '10px 16px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#F5F5F5' }}>{c.nombre}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, ...ds.muted }}>Orden: {c.orden}</span>
                <button onClick={() => eliminarCategoria(c.id)} style={{ ...ds.actionBtn, color: '#EF4444' }}>Eliminar</button>
              </div>
            </div>
          ))}
          {showAddCat && (
            <div style={{ ...ds.card, padding: 16, marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={ds.label}>Nombre categoría</label>
                <input value={catForm.nombre} onChange={e => setCatForm({ ...catForm, nombre: e.target.value })} placeholder="Ej: Pizzas, Entrantes..." style={ds.formInput} />
              </div>
              <div style={{ width: 80 }}>
                <label style={ds.label}>Orden</label>
                <input type="number" value={catForm.orden} onChange={e => setCatForm({ ...catForm, orden: +e.target.value })} style={ds.formInput} />
              </div>
              <button onClick={agregarCategoria} style={ds.primaryBtn}>Añadir</button>
              <button onClick={() => setShowAddCat(false)} style={ds.secondaryBtn}>Cerrar</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={ds.h1}>Establecimientos</h1>
        <button onClick={() => setShowCrear(true)} style={{ ...ds.primaryBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Crear establecimiento
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input placeholder="Buscar por nombre..." value={buscar} onChange={e => setBuscar(e.target.value)} style={ds.input} />
        <div style={{ display: 'flex', gap: 4 }}>
          {tipos.map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)} style={{ ...ds.filterBtn, background: filtroTipo === t ? '#FF6B2C' : 'rgba(255,255,255,0.08)', color: filtroTipo === t ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              {t === 'todos' ? 'Todos' : t === 'comida' ? '🍕 Comida' : t === 'farmacia' ? '💊 Farmacia' : '🛒 Market'}
            </button>
          ))}
        </div>
      </div>

      <div style={ds.table}>
        <div style={ds.tableHeader}>
          <span style={{ width: 44 }}></span>
          <span style={{ flex: 1 }}>Nombre</span>
          <span style={{ width: 100 }}>Categoría</span>
          <span style={{ width: 60 }}>Rating</span>
          <span style={{ width: 80 }}>Estado</span>
          <span style={{ width: 120 }}>Acciones</span>
        </div>
        {filtrados.map(e => (
          <div key={e.id} style={ds.tableRow}>
            <span style={{ width: 44 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, overflow: 'hidden' }}>
                {e.logo_url ? <img src={e.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
              </div>
            </span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#F5F5F5' }} onClick={() => { setDetalle(e); loadCategorias(e.id) }}>{e.nombre}</span>
            <span style={{ width: 100 }}>
              <span style={{ ...ds.badge, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                {e.categoria_padre === 'comida' ? '🍕' : e.categoria_padre === 'farmacia' ? '💊' : '🛒'} {e.categoria_padre}
              </span>
            </span>
            <span style={{ width: 60, fontSize: 12 }}>{e.rating?.toFixed(1)}</span>
            <span style={{ width: 80 }}>
              <span style={{ ...ds.badge, background: e.activo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: e.activo ? '#22C55E' : '#EF4444' }}>
                {e.activo ? 'Activo' : 'Inactivo'}
              </span>
            </span>
            <span style={{ width: 120, display: 'flex', gap: 6 }}>
              <button onClick={() => { setDetalle(e); loadCategorias(e.id) }} style={ds.actionBtn}>Ver</button>
              <button onClick={() => toggleActivo(e.id, e.activo)} style={{ ...ds.actionBtn, color: e.activo ? '#EF4444' : '#22C55E' }}>
                {e.activo ? 'Desactivar' : 'Activar'}
              </button>
            </span>
          </div>
        ))}
        {filtrados.length === 0 && <div style={{ padding: 32, textAlign: 'center', ...ds.muted, fontSize: 13 }}>Sin establecimientos</div>}
      </div>

      {/* Modal crear establecimiento */}
      {showCrear && (
        <div style={ds.modal} onClick={() => setShowCrear(false)}>
          <div style={ds.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F5F5F5' }}>Crear establecimiento</h2>
              <button onClick={() => setShowCrear(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#F5F5F5" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={ds.label}>Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del establecimiento" style={ds.formInput} />
              </div>
              <div>
                <label style={ds.label}>Tipo</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={ds.select}>
                  <option value="restaurante">Restaurante</option>
                  <option value="cafeteria">Cafetería</option>
                  <option value="panaderia">Panadería</option>
                  <option value="supermercado">Supermercado</option>
                  <option value="farmacia">Farmacia</option>
                  <option value="tienda">Tienda</option>
                </select>
              </div>
              <div>
                <label style={ds.label}>Categoría padre *</label>
                <select value={form.categoria_padre} onChange={e => setForm({ ...form, categoria_padre: e.target.value })} style={ds.select}>
                  {CATEGORIAS_PADRE.map(c => <option key={c} value={c}>{c === 'comida' ? '🍕 Comida' : c === 'farmacia' ? '💊 Farmacia' : '🛒 Marketplace'}</option>)}
                </select>
              </div>
              <div>
                <label style={ds.label}>Email</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@ejemplo.com" style={ds.formInput} />
              </div>
              <div>
                <label style={ds.label}>Teléfono</label>
                <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+34 600 000 000" style={ds.formInput} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={ds.label}>Dirección</label>
                <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Calle, número, ciudad" style={ds.formInput} />
              </div>
              <div>
                <label style={ds.label}>Radio cobertura (km)</label>
                <input type="number" value={form.radio_cobertura_km} onChange={e => setForm({ ...form, radio_cobertura_km: +e.target.value })} style={ds.formInput} />
              </div>
              <div>
                <label style={ds.label}>URL Logo</label>
                <input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." style={ds.formInput} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={ds.label}>URL Banner</label>
                <input value={form.banner_url} onChange={e => setForm({ ...form, banner_url: e.target.value })} placeholder="https://..." style={ds.formInput} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={ds.label}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Breve descripción..." rows={3} style={{ ...ds.formInput, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowCrear(false)} style={ds.secondaryBtn}>Cancelar</button>
              <button onClick={crearEstablecimiento} disabled={saving || !form.nombre.trim()} style={{ ...ds.primaryBtn, opacity: saving || !form.nombre.trim() ? 0.5 : 1 }}>
                {saving ? 'Creando...' : 'Crear establecimiento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
