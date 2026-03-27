import { useState } from 'react'
import { ds } from '../lib/darkStyles'

export default function Configuracion() {
  const [comisionPlataforma, setComisionPlataforma] = useState(10)
  const [comisionSocioReparto, setComisionSocioReparto] = useState(10)
  const [comisionSocioRecogida, setComisionSocioRecogida] = useState(5)
  const [radioDefault, setRadioDefault] = useState(10)
  const [categorias, setCategorias] = useState(['comida', 'farmacia', 'marketplace'])
  const [nuevaCat, setNuevaCat] = useState('')
  const [guardado, setGuardado] = useState(false)

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

  function removeCategoria(cat) {
    setCategorias(categorias.filter(c => c !== cat))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={ds.h1}>Configuracion</h1>
        {guardado && <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>Guardado</span>}
      </div>

      {/* Comisiones */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Porcentajes de comisiones</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <label style={ds.label}>Comision plataforma (%)</label>
            <input type="number" value={comisionPlataforma} onChange={e => setComisionPlataforma(+e.target.value)}
              min={0} max={50} style={ds.formInput} />
          </div>
          <div>
            <label style={ds.label}>Comision socio - Reparto (%)</label>
            <input type="number" value={comisionSocioReparto} onChange={e => setComisionSocioReparto(+e.target.value)}
              min={0} max={50} style={ds.formInput} />
          </div>
          <div>
            <label style={ds.label}>Comision socio - Recogida (%)</label>
            <input type="number" value={comisionSocioRecogida} onChange={e => setComisionSocioRecogida(+e.target.value)}
              min={0} max={50} style={ds.formInput} />
          </div>
        </div>
      </div>

      {/* Radio */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Radio de cobertura por defecto</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="range" min={1} max={30} value={radioDefault} onChange={e => setRadioDefault(+e.target.value)}
            style={{ flex: 1, maxWidth: 300 }} />
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
              <button onClick={() => removeCategoria(cat)} style={styles.tagRemove}>x</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={nuevaCat} onChange={e => setNuevaCat(e.target.value)}
            placeholder="Nueva categoria..." style={{ ...ds.formInput, width: 200 }}
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

      <button onClick={guardar} style={ds.primaryBtn}>Guardar configuracion</button>
    </div>
  )
}

const styles = {
  section: { background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#F5F5F5', marginBottom: 16 },
  tag: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 600, color: '#F5F5F5' },
  tagRemove: { background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, padding: 0 },
  addBtn: { padding: '10px 18px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#F5F5F5', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' },
  sendBtn: { padding: '10px 18px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' },
}
