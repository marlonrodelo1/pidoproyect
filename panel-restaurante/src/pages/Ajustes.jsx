import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRest } from '../context/RestContext'

export default function Ajustes() {
  const { restaurante, updateRestaurante, logout } = useRest()
  const [activo, setActivo] = useState(restaurante?.activo ?? true)
  const [nombre, setNombre] = useState(restaurante?.nombre || '')
  const [tipo, setTipo] = useState(restaurante?.tipo || 'restaurante')
  const [descripcion, setDescripcion] = useState(restaurante?.descripcion || '')
  const [direccion, setDireccion] = useState(restaurante?.direccion || '')
  const [email, setEmail] = useState(restaurante?.email || '')
  const [telefono, setTelefono] = useState(restaurante?.telefono || '')
  const [radioCobertura, setRadioCobertura] = useState(restaurante?.radio_cobertura_km || 10)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [catsGenerales, setCatsGenerales] = useState([]) // todas las categorias disponibles
  const [catsSeleccionadas, setCatsSeleccionadas] = useState([]) // IDs de categorias del restaurante
  const [catsOriginales, setCatsOriginales] = useState([])
  const logoRef = useRef()
  const bannerRef = useRef()

  useEffect(() => {
    if (restaurante) loadCategorias()
  }, [restaurante?.id])

  async function loadCategorias() {
    const [allRes, asignRes] = await Promise.all([
      supabase.from('categorias_generales').select('*').eq('activa', true).order('orden'),
      supabase.from('establecimiento_categorias').select('categoria_id').eq('establecimiento_id', restaurante.id),
    ])
    setCatsGenerales(allRes.data || [])
    const ids = (asignRes.data || []).map(r => r.categoria_id)
    setCatsSeleccionadas(ids)
    setCatsOriginales(ids)
  }

  function toggleCat(catId) {
    setCatsSeleccionadas(prev => {
      if (prev.includes(catId)) return prev.filter(id => id !== catId)
      if (prev.length >= 3) return prev // máximo 3
      return [...prev, catId]
    })
  }

  const hayCambios =
    nombre !== (restaurante?.nombre || '') ||
    tipo !== (restaurante?.tipo || 'restaurante') ||
    descripcion !== (restaurante?.descripcion || '') ||
    direccion !== (restaurante?.direccion || '') ||
    email !== (restaurante?.email || '') ||
    telefono !== (restaurante?.telefono || '') ||
    radioCobertura !== (restaurante?.radio_cobertura_km || 10) ||
    JSON.stringify(catsSeleccionadas.sort()) !== JSON.stringify(catsOriginales.sort())

  async function guardarTodo() {
    setGuardando(true)
    await updateRestaurante({
      nombre: nombre.trim(),
      tipo,
      descripcion: descripcion.trim() || null,
      direccion: direccion.trim() || null,
      email: email.trim() || null,
      telefono: telefono.trim() || null,
      radio_cobertura_km: radioCobertura,
    })
    // Guardar categorías del establecimiento (nivel 2)
    await supabase.from('establecimiento_categorias').delete().eq('establecimiento_id', restaurante.id)
    if (catsSeleccionadas.length > 0) {
      await supabase.from('establecimiento_categorias').insert(
        catsSeleccionadas.map(catId => ({ establecimiento_id: restaurante.id, categoria_id: catId }))
      )
    }
    setCatsOriginales([...catsSeleccionadas])
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2500)
  }

  async function toggleActivo() {
    const nuevo = !activo
    setActivo(nuevo)
    await updateRestaurante({ activo: nuevo })
  }

  async function subirImagen(file, bucket, field) {
    const ext = file.name.split('.').pop()
    const path = `establecimientos/${restaurante.id}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) { alert('Error al subir: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    await updateRestaurante({ [field]: publicUrl })
  }

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', fontSize: 13, fontFamily: 'inherit', background: 'rgba(255,255,255,0.06)', color: '#F5F5F5', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 4, display: 'block' }

  return (
    <div style={{ paddingBottom: hayCambios ? 90 : 0 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>Ajustes</h2>

      {/* Estado abierto/cerrado — inmediato */}
      <div style={{ background: activo ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', borderRadius: 14, padding: '16px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: activo ? '#4ADE80' : '#EF4444' }}>{activo ? 'Abierto' : 'Cerrado'}</div>
          <div style={{ fontSize: 12, color: activo ? '#22C55E' : '#EF4444', marginTop: 2 }}>{activo ? 'Recibiendo pedidos' : 'No se reciben pedidos'}</div>
        </div>
        <button onClick={toggleActivo} style={{ width: 52, height: 28, borderRadius: 14, border: 'none', background: activo ? '#16A34A' : 'rgba(255,255,255,0.2)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
          <span style={{ position: 'absolute', top: 3, left: activo ? 27 : 3, width: 22, height: 22, borderRadius: 11, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
      </div>

      {/* Logo */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Logo</h3>
        <input ref={logoRef} type="file" accept="image/*" hidden onChange={e => e.target.files[0] && subirImagen(e.target.files[0], 'logos', 'logo_url')} />
        <div onClick={() => logoRef.current?.click()} style={{ width: 100, height: 100, borderRadius: 20, background: 'var(--c-surface2)', border: '2px dashed var(--c-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: '0 auto 12px', overflow: 'hidden' }}>
          {restaurante?.logo_url ? <img src={restaurante.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><span style={{ fontSize: 28, marginBottom: 4 }}>📷</span><span style={{ fontSize: 10, color: 'var(--c-muted)', fontWeight: 600 }}>Subir logo</span></>}
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-muted)' }}>200 × 200 px recomendado · PNG o JPG</div>
      </div>

      {/* Banner */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Banner</h3>
        <input ref={bannerRef} type="file" accept="image/*" hidden onChange={e => e.target.files[0] && subirImagen(e.target.files[0], 'banners', 'banner_url')} />
        <div onClick={() => bannerRef.current?.click()} style={{ width: '100%', height: 100, borderRadius: 14, background: 'var(--c-surface2)', border: '2px dashed var(--c-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 12, overflow: 'hidden' }}>
          {restaurante?.banner_url ? <img src={restaurante.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><span style={{ fontSize: 28, marginBottom: 4 }}>🖼️</span><span style={{ fontSize: 10, color: 'var(--c-muted)', fontWeight: 600 }}>Subir banner</span></>}
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-muted)' }}>800 × 300 px recomendado · PNG o JPG</div>
      </div>

      {/* Información editable */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Información</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} style={inp} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Tipo de negocio</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={inp}>
            <option value="restaurante">Restaurante</option>
            <option value="cafeteria">Cafetería</option>
            <option value="pizzeria">Pizzería</option>
            <option value="hamburgueseria">Hamburguesería</option>
            <option value="sushi">Sushi</option>
            <option value="minimarket">Minimarket</option>
            <option value="fruteria">Frutería</option>
            <option value="farmacia">Farmacia</option>
            <option value="panaderia">Panadería</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Descripción</label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Breve descripción del negocio..." rows={2} style={{ ...inp, resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Dirección</label>
          <input value={direccion} onChange={e => setDireccion(e.target.value)} style={inp} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Teléfono</label>
          <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} style={inp} />
        </div>
      </div>

      {/* Radio de cobertura */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Radio de cobertura</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <input type="range" min="1" max="30" value={radioCobertura} onChange={e => setRadioCobertura(Number(e.target.value))} style={{ flex: 1, accentColor: '#B91C1C' }} />
          <span style={{ minWidth: 50, textAlign: 'center', fontWeight: 800, fontSize: 16, color: 'var(--c-primary)' }}>{radioCobertura} km</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 8 }}>Solo los clientes dentro de este radio verán tu restaurante.</div>
      </div>

      {/* Categorías del establecimiento (nivel 2) */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--c-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Categorías de tu negocio</h3>
        <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 14 }}>Elige hasta 3 categorías para que los clientes te encuentren (ej: Pizzas, Burgers)</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {catsGenerales.map(c => {
            const sel = catsSeleccionadas.includes(c.id)
            const disabled = !sel && catsSeleccionadas.length >= 3
            return (
              <button key={c.id} onClick={() => !disabled && toggleCat(c.id)} style={{
                padding: '8px 14px', borderRadius: 50, cursor: disabled ? 'default' : 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                border: sel ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
                background: sel ? 'rgba(185,28,28,0.12)' : 'var(--c-surface)',
                color: sel ? 'var(--c-primary)' : disabled ? 'rgba(255,255,255,0.2)' : 'var(--c-text)',
                opacity: disabled ? 0.5 : 1,
              }}>
                {c.emoji} {c.nombre}
              </button>
            )
          })}
        </div>
        {catsSeleccionadas.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--c-primary)', marginTop: 10, fontWeight: 600 }}>
            {catsSeleccionadas.length}/3 seleccionadas
          </div>
        )}
      </div>

      {/* Cerrar sesión */}
      <button onClick={logout} style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>Cerrar sesión</button>

      {/* Botón guardar cambios flotante */}
      {hayCambios && (
        <div style={{
          position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 420, padding: '0 20px', zIndex: 40,
          animation: 'fadeIn 0.3s ease',
        }}>
          <button onClick={guardarTodo} disabled={guardando} style={{
            width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
            background: guardando ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff',
            fontSize: 15, fontWeight: 800, cursor: guardando ? 'default' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 8px 32px rgba(185,28,28,0.3), 0 4px 12px rgba(0,0,0,0.2)',
          }}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}

      {/* Toast confirmación */}
      {guardado && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#16A34A', color: '#fff', padding: '12px 24px', borderRadius: 12,
          fontSize: 13, fontWeight: 700, zIndex: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.3s ease',
        }}>
          Cambios guardados correctamente
        </div>
      )}
    </div>
  )
}
