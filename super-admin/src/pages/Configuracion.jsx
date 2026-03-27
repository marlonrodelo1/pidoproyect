import { useState } from 'react'

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
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Configuracion</h1>
        {guardado && <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>Guardado</span>}
      </div>

      {/* Comisiones */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Porcentajes de comisiones</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <label style={styles.label}>Comision plataforma (%)</label>
            <input type="number" value={comisionPlataforma} onChange={e => setComisionPlataforma(+e.target.value)}
              min={0} max={50} style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>Comision socio - Reparto (%)</label>
            <input type="number" value={comisionSocioReparto} onChange={e => setComisionSocioReparto(+e.target.value)}
              min={0} max={50} style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>Comision socio - Recogida (%)</label>
            <input type="number" value={comisionSocioRecogida} onChange={e => setComisionSocioRecogida(+e.target.value)}
              min={0} max={50} style={styles.input} />
          </div>
        </div>
      </div>

      {/* Radio */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Radio de cobertura por defecto</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="range" min={1} max={30} value={radioDefault} onChange={e => setRadioDefault(+e.target.value)}
            style={{ flex: 1, maxWidth: 300 }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{radioDefault} km</span>
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
            placeholder="Nueva categoria..." style={{ ...styles.input, width: 200 }}
            onKeyDown={e => e.key === 'Enter' && addCategoria()} />
          <button onClick={addCategoria} style={styles.addBtn}>Agregar</button>
        </div>
      </div>

      {/* Notificaciones masivas */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Notificacion masiva</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Titulo de la notificacion" style={styles.input} />
          <textarea placeholder="Mensaje..." rows={3} style={{ ...styles.input, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={styles.input}>
              <option value="todos">Todos los usuarios</option>
              <option value="socios">Solo socios</option>
              <option value="restaurantes">Solo restaurantes</option>
            </select>
            <button style={styles.sendBtn}>Enviar notificacion</button>
          </div>
        </div>
      </div>

      <button onClick={guardar} style={styles.saveBtn}>Guardar configuracion</button>
    </div>
  )
}

const styles = {
  section: { background: '#fff', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6 },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: "'DM Sans', sans-serif", width: '100%', outline: 'none' },
  tag: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: '#F3F4F6', fontSize: 12, fontWeight: 600, color: '#374151' },
  tagRemove: { background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 12, fontWeight: 700, padding: 0 },
  addBtn: { padding: '10px 18px', borderRadius: 8, border: 'none', background: '#F3F4F6', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' },
  sendBtn: { padding: '10px 18px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' },
  saveBtn: { padding: '12px 28px', borderRadius: 10, border: 'none', background: '#FF6B2C', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
}
