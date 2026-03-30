import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ds } from '../lib/darkStyles'
import { Trash2 } from 'lucide-react'

export default function Configuracion() {
  const [comisionPlataforma, setComisionPlataforma] = useState(10)
  const [comisionSocioReparto, setComisionSocioReparto] = useState(10)
  const [comisionSocioRecogida, setComisionSocioRecogida] = useState(5)
  const [radioDefault, setRadioDefault] = useState(10)
  const [categorias, setCategorias] = useState(['comida', 'farmacia', 'marketplace'])
  const [nuevaCat, setNuevaCat] = useState('')
  const [guardado, setGuardado] = useState(false)

  // Categorías generales
  const [catsGenerales, setCatsGenerales] = useState([])
  const [nuevaCatGen, setNuevaCatGen] = useState({ nombre: '', emoji: '🍽️' })

  // Páginas legales
  const [paginasLegales, setPaginasLegales] = useState([])
  const [editLegal, setEditLegal] = useState(null) // null = lista, objeto = editando
  const [legalForm, setLegalForm] = useState({ titulo: '', contenido: '' })
  const [savingLegal, setSavingLegal] = useState(false)

  useEffect(() => { loadCatsGenerales(); loadPaginasLegales() }, [])

  async function loadCatsGenerales() {
    const { data } = await supabase.from('categorias_generales').select('*').order('orden')
    setCatsGenerales(data || [])
  }

  async function addCatGeneral() {
    if (!nuevaCatGen.nombre.trim()) return
    await supabase.from('categorias_generales').insert({
      nombre: nuevaCatGen.nombre.trim(),
      emoji: nuevaCatGen.emoji || '🍽️',
      orden: catsGenerales.length + 1,
    })
    setNuevaCatGen({ nombre: '', emoji: '🍽️' })
    loadCatsGenerales()
  }

  async function removeCatGeneral(id) {
    await supabase.from('categorias_generales').delete().eq('id', id)
    loadCatsGenerales()
  }

  async function loadPaginasLegales() {
    const { data } = await supabase.from('paginas_legales').select('*').order('created_at')
    setPaginasLegales(data || [])
  }

  async function guardarPaginaLegal() {
    if (!legalForm.titulo.trim() || !legalForm.contenido.trim()) return
    setSavingLegal(true)
    await supabase.from('paginas_legales').update({
      titulo: legalForm.titulo.trim(),
      contenido: legalForm.contenido.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', editLegal.id)
    setSavingLegal(false)
    setEditLegal(null)
    loadPaginasLegales()
  }

  function guardar() {
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  function addCategoria() {
    if (nuevaCat.trim() && !categorias.includes(nuevaCat.trim().toLowerCase())) {
      setCategorias([...categorias, nuevaCat.trim().toLowerCase()])
      setNuevaCat('')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={ds.h1}>Configuracion</h1>
        {guardado && <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>Guardado</span>}
      </div>

      {/* Categorías generales */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Categorías generales (se muestran en pido-app)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {catsGenerales.map(cat => (
            <span key={cat.id} style={styles.tag}>
              {cat.emoji} {cat.nombre}
              <button onClick={() => removeCatGeneral(cat.id)} style={styles.tagRemove}><Trash2 size={11} /></button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={nuevaCatGen.emoji} onChange={e => setNuevaCatGen({ ...nuevaCatGen, emoji: e.target.value })}
            placeholder="🍽️" style={{ ...ds.formInput, width: 60, textAlign: 'center' }} />
          <input value={nuevaCatGen.nombre} onChange={e => setNuevaCatGen({ ...nuevaCatGen, nombre: e.target.value })}
            placeholder="Nombre categoría..." style={{ ...ds.formInput, flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && addCatGeneral()} />
          <button onClick={addCatGeneral} style={ds.primaryBtn}>Añadir</button>
        </div>
      </div>

      {/* Comisiones */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Porcentajes de comisiones</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <label style={ds.label}>Comision plataforma (%)</label>
            <input type="number" value={comisionPlataforma} onChange={e => setComisionPlataforma(+e.target.value)} min={0} max={50} style={ds.formInput} />
          </div>
          <div>
            <label style={ds.label}>Comision socio - Reparto (%)</label>
            <input type="number" value={comisionSocioReparto} onChange={e => setComisionSocioReparto(+e.target.value)} min={0} max={50} style={ds.formInput} />
          </div>
          <div>
            <label style={ds.label}>Comision socio - Recogida (%)</label>
            <input type="number" value={comisionSocioRecogida} onChange={e => setComisionSocioRecogida(+e.target.value)} min={0} max={50} style={ds.formInput} />
          </div>
        </div>
      </div>

      {/* Radio */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Radio de cobertura por defecto</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="range" min={1} max={30} value={radioDefault} onChange={e => setRadioDefault(+e.target.value)} style={{ flex: 1, maxWidth: 300 }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#F5F5F5' }}>{radioDefault} km</span>
        </div>
      </div>

      {/* Categorias padre */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Categorias padre (verticales)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {categorias.map(cat => (
            <span key={cat} style={styles.tag}>
              {cat}
              <button onClick={() => setCategorias(categorias.filter(c => c !== cat))} style={styles.tagRemove}>x</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={nuevaCat} onChange={e => setNuevaCat(e.target.value)} placeholder="Nueva categoria..." style={{ ...ds.formInput, width: 200 }}
            onKeyDown={e => e.key === 'Enter' && addCategoria()} />
          <button onClick={addCategoria} style={styles.addBtn}>Agregar</button>
        </div>
      </div>

      {/* Notificaciones masivas */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Notificacion masiva</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Titulo de la notificacion" style={ds.formInput} />
          <textarea placeholder="Mensaje..." rows={3} style={{ ...ds.formInput, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={ds.select}>
              <option value="todos">Todos los usuarios</option>
              <option value="socios">Solo socios</option>
              <option value="restaurantes">Solo restaurantes</option>
            </select>
            <button style={styles.sendBtn}>Enviar notificacion</button>
          </div>
        </div>
      </div>

      {/* Páginas legales */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Páginas legales</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Edita los textos legales que se muestran en pidoo.es/terminos y pidoo.es/privacidad</p>

        {editLegal ? (
          <div>
            <button onClick={() => setEditLegal(null)} style={{ background: 'none', border: 'none', color: '#FF6B2C', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: 16, padding: 0 }}>← Volver a la lista</button>
            <div style={{ marginBottom: 12 }}>
              <label style={ds.label}>Título</label>
              <input value={legalForm.titulo} onChange={e => setLegalForm({ ...legalForm, titulo: e.target.value })} style={ds.formInput} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={ds.label}>Contenido (HTML)</label>
              <textarea value={legalForm.contenido} onChange={e => setLegalForm({ ...legalForm, contenido: e.target.value })} rows={18} style={{ ...ds.formInput, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }} />
            </div>
            <div style={{ marginBottom: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Vista previa</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: '#F5F5F5' }} dangerouslySetInnerHTML={{ __html: legalForm.contenido }} />
            </div>
            <button onClick={guardarPaginaLegal} disabled={savingLegal} style={{ ...ds.primaryBtn, width: '100%' }}>
              {savingLegal ? 'Guardando...' : 'Guardar página'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {paginasLegales.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#F5F5F5' }}>{p.titulo}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>pidoo.es/{p.slug} · Editado: {new Date(p.updated_at).toLocaleDateString('es-ES')}</div>
                </div>
                <button onClick={() => { setEditLegal(p); setLegalForm({ titulo: p.titulo, contenido: p.contenido }) }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#FF6B2C', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Editar</button>
              </div>
            ))}
            {paginasLegales.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No hay páginas legales configuradas</div>}
          </div>
        )}
      </div>

      <button onClick={guardar} style={ds.primaryBtn}>Guardar configuracion</button>
    </div>
  )
}

const styles = {
  section: { background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#F5F5F5', marginBottom: 16 },
  tag: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 600, color: '#F5F5F5' },
  tagRemove: { background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, padding: 0, display: 'flex', alignItems: 'center' },
  addBtn: { padding: '10px 18px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#F5F5F5', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' },
  sendBtn: { padding: '10px 18px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' },
}
