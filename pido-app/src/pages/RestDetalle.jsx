import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import Stars from '../components/Stars'
import EntregaBadge from '../components/EntregaBadge'

export default function RestDetalle({ establecimiento, onBack }) {
  const { addItem } = useCart()
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [modal, setModal] = useState(null)
  const [tamanos, setTamanos] = useState([])
  const [gruposExtras, setGruposExtras] = useState([])
  const [tamSel, setTamSel] = useState(null)
  const [exSel, setExSel] = useState([])
  const [cant, setCant] = useState(1)
  const [loading, setLoading] = useState(true)

  const est = establecimiento

  useEffect(() => {
    fetchCarta()
  }, [est.id])

  async function fetchCarta() {
    setLoading(true)
    const [catRes, prodRes] = await Promise.all([
      supabase.from('categorias').select('*').eq('establecimiento_id', est.id).eq('activa', true).order('orden'),
      supabase.from('productos').select('*').eq('establecimiento_id', est.id).eq('disponible', true).order('orden'),
    ])
    setCategorias(catRes.data || [])
    setProductos(prodRes.data || [])
    setLoading(false)
  }

  async function abrirProducto(p) {
    setModal(p)
    setCant(1)
    setExSel([])
    setTamSel(null)

    // Cargar tamaños
    const { data: tams } = await supabase
      .from('producto_tamanos')
      .select('*')
      .eq('producto_id', p.id)
      .order('orden')
    setTamanos(tams || [])
    if (tams && tams.length > 0) setTamSel(0)

    // Cargar extras
    const { data: prodExtras } = await supabase
      .from('producto_extras')
      .select('grupo_id')
      .eq('producto_id', p.id)

    if (prodExtras && prodExtras.length > 0) {
      const grupoIds = prodExtras.map(pe => pe.grupo_id)
      const { data: grupos } = await supabase
        .from('grupos_extras')
        .select('*, extras_opciones(*)')
        .in('id', grupoIds)
      setGruposExtras(grupos || [])
    } else {
      setGruposExtras([])
    }
  }

  function precioTotal() {
    if (!modal) return 0
    const base = tamSel !== null && tamanos[tamSel] ? tamanos[tamSel].precio : modal.precio
    const extrasTotal = exSel.reduce((s, e) => s + e.precio, 0)
    return (base + extrasTotal) * cant
  }

  function confirmarItem() {
    addItem({
      producto_id: modal.id,
      nombre: modal.nombre,
      tamano: tamSel !== null && tamanos[tamSel] ? tamanos[tamSel].nombre : null,
      extras: exSel.map(e => e.nombre),
      precio_unitario: precioTotal() / cant,
      cantidad: cant,
      establecimiento_id: est.id,
      establecimiento_nombre: est.nombre,
      coste_envio: 0,
    })
    setModal(null)
  }

  function toggleExtra(op, max) {
    setExSel(prev => {
      if (prev.find(e => e.id === op.id)) return prev.filter(e => e.id !== op.id)
      if (prev.length >= max) return prev
      return [...prev, op]
    })
  }

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--c-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0, fontFamily: 'inherit' }}>← Volver</button>

      {/* Banner */}
      <div style={{
        height: 150, borderRadius: 16, marginBottom: 16,
        background: est.banner_url ? `url(${est.banner_url}) center/cover` : 'linear-gradient(135deg, var(--c-primary-light), var(--c-primary-soft))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52,
      }}>
        {est.logo_url ? <img src={est.logo_url} alt="" style={{ width: 70, height: 70, borderRadius: 18, objectFit: 'cover' }} /> : '🍽️'}
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)', margin: '0 0 4px' }}>{est.nombre}</h2>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--c-muted)', marginBottom: 4, flexWrap: 'wrap' }}>
        <Stars rating={est.rating} />
        <span>({est.total_resenas})</span>
        <span>📍 {est.direccion}</span>
      </div>
      {est.descripcion && <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 12 }}>{est.descripcion}</p>}

      {/* Carta */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-muted)' }}>Cargando carta...</div>
      ) : (
        <>
          {categorias.map(cat => {
            const prods = productos.filter(p => p.categoria_id === cat.id)
            if (prods.length === 0) return null
            return (
              <div key={cat.id} style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text)', marginBottom: 10 }}>{cat.nombre}</h3>
                {prods.map(p => (
                  <div key={p.id} onClick={() => abrirProducto(p)} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--c-border)', cursor: 'pointer' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)', marginBottom: 2 }}>{p.nombre}</div>
                      {p.descripcion && <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>{p.descripcion}</div>}
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--c-primary)' }}>{p.precio.toFixed(2)} €</div>
                    </div>
                    {p.imagen_url && (
                      <img src={p.imagen_url} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                    )}
                  </div>
                ))}
              </div>
            )
          })}
          {/* Productos sin categoría */}
          {productos.filter(p => !p.categoria_id).map(p => (
            <div key={p.id} onClick={() => abrirProducto(p)} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--c-border)', cursor: 'pointer' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)', marginBottom: 2 }}>{p.nombre}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--c-primary)' }}>{p.precio.toFixed(2)} €</div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Modal producto */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-bg)', borderRadius: '24px 24px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 420, maxHeight: '80vh', overflowY: 'auto', animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--c-text)' }}>{modal.nombre}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--c-muted)' }}>×</button>
            </div>
            {modal.descripcion && <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 16 }}>{modal.descripcion}</p>}

            {/* Tamaños */}
            {tamanos.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>Tamaño</div>
                {tamanos.map((t, i) => (
                  <button key={t.id} onClick={() => setTamSel(i)} style={{
                    display: 'flex', justifyContent: 'space-between', width: '100%', padding: '12px 14px',
                    borderRadius: 10, marginBottom: 6,
                    border: tamSel === i ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
                    background: tamSel === i ? 'var(--c-primary-light)' : 'var(--c-surface)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>{t.nombre}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-primary)' }}>{t.precio.toFixed(2)} €</span>
                  </button>
                ))}
              </div>
            )}

            {/* Extras */}
            {gruposExtras.map(g => (
              <div key={g.id} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>{g.nombre}</div>
                <div style={{ fontSize: 10, color: 'var(--c-muted)', marginBottom: 8 }}>
                  {g.tipo === 'single' ? 'Elige 1' : `Máx. ${g.max_selecciones}`}
                </div>
                {(g.extras_opciones || []).map(op => {
                  const sel = exSel.find(e => e.id === op.id)
                  return (
                    <button key={op.id} onClick={() => toggleExtra(op, g.max_selecciones)} style={{
                      display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 14px',
                      borderRadius: 10, marginBottom: 6,
                      border: sel ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
                      background: sel ? 'var(--c-primary-light)' : 'var(--c-surface)',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 5,
                          border: sel ? 'none' : '2px solid var(--c-border)',
                          background: sel ? 'var(--c-primary)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{sel && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>}</div>
                        <span style={{ fontSize: 13, color: 'var(--c-text)' }}>{op.nombre}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-primary)' }}>+{op.precio.toFixed(2)} €</span>
                    </button>
                  )
                })}
              </div>
            ))}

            {/* Cantidad */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
              <button onClick={() => setCant(Math.max(1, cant - 1))} style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--c-border)', background: 'rgba(255,255,255,0.08)', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--c-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)' }}>{cant}</span>
              <button onClick={() => setCant(cant + 1)} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'var(--c-primary)', color: '#fff', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>

            <button onClick={confirmarItem} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: 'var(--c-primary)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              Añadir — {precioTotal().toFixed(2)} €
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
