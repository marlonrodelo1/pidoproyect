import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { supabase } from './lib/supabase'
import { crearPagoStripe } from './lib/stripe'
import Stars from './components/Stars'
import ShareModal from './components/ShareModal'
import './index.css'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// --- Componentes auxiliares ---
function ModoEntregaBadge({ modo, radioKm }) {
  const config = {
    recogida: { label: 'Solo recogida', icon: '🏪', bg: '#FEF3C7', color: '#92400E' },
    reparto: { label: `Reparto · ${radioKm} km`, icon: '🛵', bg: '#DCFCE7', color: '#166534' },
    ambos: { label: `Recogida y reparto · ${radioKm} km`, icon: '🛵', bg: '#DBEAFE', color: '#1E40AF' },
  }
  const c = config[modo] || config.ambos
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.bg, color: c.color, fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 50, marginTop: 8 }}>
      <span>{c.icon}</span> {c.label}
    </div>
  )
}

function BannerPidoApp() {
  return (
    <div style={{ background: 'linear-gradient(135deg, #1A1A18 0%, #2D2D2A 100%)', borderRadius: 14, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--c-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 18 }}>🛵</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Estos pedidos son para recoger</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 }}>¿Quieres entrega a domicilio?</div>
      </div>
      <button style={{ background: 'var(--c-accent)', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
        Ir a PIDO
      </button>
    </div>
  )
}

function ResenaCard({ r }) {
  return (
    <div style={{ background: 'var(--c-surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--c-border)', minWidth: 260, flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)' }}>{r.usuario_nombre || 'Usuario'}</span>
        <Stars rating={r.rating} size={11} />
      </div>
      {r.texto && <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 6, lineHeight: 1.5 }}>{r.texto}</p>}
    </div>
  )
}

function EstablecimientoCard({ r, onOpen, modoEntrega, socioEnServicio }) {
  const [hover, setHover] = useState(false)
  const tieneDelivery = socioEnServicio && modoEntrega !== 'recogida'
  return (
    <div onClick={() => onOpen(r)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--c-surface)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover ? '0 12px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid var(--c-border)',
      }}>
      <div style={{
        height: 110, background: r.banner_url ? `url(${r.banner_url}) center/cover` : 'linear-gradient(135deg, var(--c-accent-light), var(--c-accent-soft))',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
          {tieneDelivery && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 50, background: 'rgba(255,107,44,0.9)', color: '#fff', backdropFilter: 'blur(4px)' }}>Delivery</span>
          )}
          <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 50, background: 'rgba(255,255,255,0.9)', color: 'var(--c-muted)', backdropFilter: 'blur(4px)' }}>Recogida</span>
        </div>
      </div>
      {/* Logo mitad fuera mitad dentro */}
      <div style={{ position: 'relative', padding: '0 12px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, border: '3px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--c-surface)', fontSize: 20,
          position: 'absolute', top: -22, left: 12,
        }}>
          {r.logo_url ? <img src={r.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
        </div>
      </div>
      <div style={{ padding: '28px 14px 12px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--c-text)' }}>{r.nombre}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--c-muted)' }}>
          <Stars rating={r.rating} size={10} />
          <span>{r.rating?.toFixed(1)}</span>
          <span>({r.total_resenas})</span>
        </div>
      </div>
    </div>
  )
}

// --- Detalle del establecimiento ---
function EstablecimientoDetail({ est, onBack, carrito, setCarrito, modoEntrega, resenas }) {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const soloRecogida = modoEntrega === 'recogida'

  useEffect(() => { fetchCarta() }, [est.id])

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

  function addItem(p) {
    setCarrito(prev => {
      const existing = prev.find(i => i.id === p.id)
      if (existing) return prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { ...p, cantidad: 1, establecimiento_id: est.id, establecimiento_nombre: est.nombre }]
    })
  }

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--c-accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0, fontFamily: 'inherit' }}>← Volver</button>

      <div style={{ height: 160, background: est.banner_url ? `url(${est.banner_url}) center/cover` : 'linear-gradient(135deg, var(--c-accent-light), var(--c-accent-soft))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, marginBottom: 20 }}>
        {est.logo_url ? <img src={est.logo_url} alt="" style={{ width: 70, height: 70, borderRadius: 18, objectFit: 'cover' }} /> : '🍽️'}
      </div>

      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--c-text)' }}>{est.nombre}</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6, fontSize: 13, color: 'var(--c-muted)' }}>
        <Stars rating={est.rating} />
        <span>({est.total_resenas} reseñas)</span>
      </div>
      {est.direccion && <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 16 }}>📍 {est.direccion}</div>}

      {soloRecogida && (
        <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 18, marginTop: 1 }}>🏪</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#92400E', marginBottom: 2 }}>Recogida en tienda</div>
            <div style={{ fontSize: 12, color: '#A16207', lineHeight: 1.4 }}>{est.direccion}</div>
          </div>
        </div>
      )}

      {soloRecogida && <BannerPidoApp />}

      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--c-text)' }}>Carta</h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-muted)' }}>Cargando carta...</div>
      ) : (
        <>
          {categorias.map(cat => {
            const prods = productos.filter(p => p.categoria_id === cat.id)
            if (prods.length === 0) return null
            return (
              <div key={cat.id} style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>{cat.nombre}</h4>
                {prods.map(p => {
                  const enCarrito = carrito.find(i => i.id === p.id)
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--c-surface)', borderRadius: 12, border: '1px solid var(--c-border)', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--c-text)', marginBottom: 2 }}>{p.nombre}</div>
                        {p.descripcion && <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 4 }}>{p.descripcion}</div>}
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-accent)' }}>{p.precio.toFixed(2)} €</div>
                      </div>
                      {p.imagen_url && <img src={p.imagen_url} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', marginRight: 10 }} />}
                      <button onClick={() => addItem(p)} style={{
                        width: 38, height: 38, borderRadius: 10, border: 'none',
                        background: enCarrito ? 'var(--c-accent)' : 'var(--c-surface2)',
                        color: enCarrito ? '#fff' : 'var(--c-accent)',
                        fontSize: 20, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {enCarrito ? enCarrito.cantidad : '+'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
          {/* Productos sin categoría */}
          {productos.filter(p => !p.categoria_id).map(p => {
            const enCarrito = carrito.find(i => i.id === p.id)
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--c-surface)', borderRadius: 12, border: '1px solid var(--c-border)', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--c-text)' }}>{p.nombre}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-accent)' }}>{p.precio.toFixed(2)} €</div>
                </div>
                <button onClick={() => addItem(p)} style={{
                  width: 38, height: 38, borderRadius: 10, border: 'none',
                  background: enCarrito ? 'var(--c-accent)' : 'var(--c-surface2)',
                  color: enCarrito ? '#fff' : 'var(--c-accent)', fontSize: 20, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {enCarrito ? enCarrito.cantidad : '+'}
                </button>
              </div>
            )
          })}
        </>
      )}

      {/* Reseñas del establecimiento */}
      {resenas.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text)', marginBottom: 12 }}>Reseñas</h3>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {resenas.map(r => <ResenaCard key={r.id} r={r} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Formulario Pago Tarjeta ---
function FormularioPagoTienda({ clientSecret, total, onSuccess, onCancel }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePagar = async () => {
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    })
    if (stripeError) {
      setError(stripeError.message === 'Your card number is incomplete.' ? 'Completa los datos de tu tarjeta' : stripeError.message)
      setLoading(false)
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    } else {
      setError('El pago no se pudo completar')
      setLoading(false)
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--c-accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16, padding: 0 }}>← Volver al carrito</button>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>Pago con tarjeta</div>
      <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 16 }}>Introduce los datos de tu tarjeta</div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', padding: '16px 14px', marginBottom: 16 }}>
        <CardElement options={{ style: { base: { fontSize: '16px', fontFamily: "'DM Sans', sans-serif", color: '#F5F5F5', '::placeholder': { color: 'rgba(255,255,255,0.4)' } }, invalid: { color: '#EF4444' } } }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>🔒 Pago seguro procesado por Stripe</span>
      </div>
      {error && <div style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 12, textAlign: 'center', fontWeight: 600 }}>{error}</div>}
      <button onClick={handlePagar} disabled={loading || !stripe} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: 'none', background: loading ? 'var(--c-muted)' : 'var(--c-accent)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
        {loading ? 'Procesando pago...' : `Pagar ${total.toFixed(2)} €`}
      </button>
    </div>
  )
}

// --- Carrito ---
function CarritoBar({ carrito, setCarrito, modoEntrega, socioId, socioNombre, socioEnServicio }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [metodoPago, setMetodoPago] = useState('tarjeta')
  const [pasoTarjeta, setPasoTarjeta] = useState(false)
  const [clientSecret, setClientSecret] = useState(null)
  const [codigoPedido, setCodigoPedido] = useState(null)
  const [tipoEntrega, setTipoEntrega] = useState(socioEnServicio && modoEntrega !== 'recogida' ? 'delivery' : 'recogida')
  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const items = carrito.reduce((s, i) => s + i.cantidad, 0)
  const tieneDelivery = socioEnServicio && modoEntrega !== 'recogida'
  const envioFinal = tipoEntrega === 'recogida' ? 0 : 3.50
  const totalFinal = total + envioFinal
  const soloRecogida = !tieneDelivery

  if (items === 0) return null

  async function iniciarPago() {
    if (metodoPago === 'tarjeta') {
      setLoading(true)
      try {
        const codigo = `PG-${Date.now()}`
        setCodigoPedido(codigo)
        const result = await crearPagoStripe({ amount: totalFinal, pedidoCodigo: codigo })
        setClientSecret(result.clientSecret)
        setPasoTarjeta(true)
      } catch (e) {
        alert('Error al conectar con el sistema de pagos: ' + e.message)
      } finally {
        setLoading(false)
      }
    } else {
      await crearPedido(null)
    }
  }

  async function crearPedido(stripePaymentId) {
    setLoading(true)
    try {
      const codigo = codigoPedido || `PG-${Date.now()}`

      const { data: pedido, error } = await supabase.from('pedidos').insert({
        codigo,
        establecimiento_id: carrito[0].establecimiento_id,
        socio_id: socioId,
        canal: 'pidogo',
        estado: 'nuevo',
        metodo_pago: metodoPago,
        stripe_payment_id: stripePaymentId,
        subtotal: total,
        coste_envio: envioFinal,
        propina: 0,
        total: totalFinal,
      }).select().single()

      if (error) throw error

      const pedidoItems = carrito.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.id,
        nombre_producto: item.nombre,
        precio_unitario: item.precio,
        cantidad: item.cantidad,
      }))
      await supabase.from('pedido_items').insert(pedidoItems)

      setCarrito([])
      setOpen(false)
      setPasoTarjeta(false)
      setClientSecret(null)
      setCodigoPedido(null)
      alert(`Pedido ${codigo} creado. ${soloRecogida ? 'Recógelo en el restaurante.' : `${socioNombre} te lo llevará.`}`)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)} style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        background: 'var(--c-accent)', color: '#fff', borderRadius: 16,
        padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 20, minWidth: 300, maxWidth: 380, cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 50, fontFamily: 'inherit',
      }}>
        <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '2px 10px', fontWeight: 700, fontSize: 14 }}>{items}</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Ver carrito</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{totalFinal.toFixed(2)} €</span>
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => { setOpen(false); setPasoTarjeta(false) }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-bg)', borderRadius: '24px 24px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp 0.3s ease' }}>

            {pasoTarjeta && clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <FormularioPagoTienda
                  clientSecret={clientSecret}
                  total={totalFinal}
                  onSuccess={(paymentId) => crearPedido(paymentId)}
                  onCancel={() => setPasoTarjeta(false)}
                />
              </Elements>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--c-text)' }}>Tu pedido</h3>
                  <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--c-muted)' }}>×</button>
                </div>

                {/* Selector tipo entrega */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>Tipo de entrega</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {tieneDelivery && (
                      <button onClick={() => setTipoEntrega('delivery')} style={{
                        flex: 1, padding: '12px 0', borderRadius: 10,
                        border: tipoEntrega === 'delivery' ? '2px solid var(--c-accent)' : '1px solid var(--c-border)',
                        background: tipoEntrega === 'delivery' ? 'var(--c-accent-light)' : 'rgba(255,255,255,0.08)',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        color: tipoEntrega === 'delivery' ? 'var(--c-accent)' : 'var(--c-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <span style={{ fontSize: 16 }}>🛵</span> Delivery
                      </button>
                    )}
                    <button onClick={() => setTipoEntrega('recogida')} style={{
                      flex: 1, padding: '12px 0', borderRadius: 10,
                      border: tipoEntrega === 'recogida' ? '2px solid var(--c-accent)' : '1px solid var(--c-border)',
                      background: tipoEntrega === 'recogida' ? 'var(--c-accent-light)' : 'rgba(255,255,255,0.08)',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      color: tipoEntrega === 'recogida' ? 'var(--c-accent)' : 'var(--c-text)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: 16 }}>🏪</span> Recogida
                    </button>
                  </div>
                  {tipoEntrega === 'recogida' && (
                    <div style={{ fontSize: 11, color: 'var(--c-accent)', fontWeight: 600, marginTop: 6 }}>
                      Recogelo en el restaurante · Sin coste de envio
                    </div>
                  )}
                </div>

                {carrito.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--c-border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--c-text)' }}>{item.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{item.establecimiento_nombre}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setCarrito(prev => prev.map(i => i.id === item.id ? { ...i, cantidad: Math.max(0, i.cantidad - 1) } : i).filter(i => i.cantidad > 0))} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--c-border)', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text)' }}>−</button>
                        <span style={{ fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: 'center', color: 'var(--c-text)' }}>{item.cantidad}</span>
                        <button onClick={() => setCarrito(prev => prev.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i))} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--c-border)', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text)' }}>+</button>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, minWidth: 60, textAlign: 'right', color: 'var(--c-text)' }}>{(item.precio * item.cantidad).toFixed(2)} €</span>
                    </div>
                  </div>
                ))}

                {/* Método de pago */}
                <div style={{ marginTop: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>Método de pago</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ id: 'tarjeta', l: '💳 Tarjeta' }, { id: 'efectivo', l: '💵 Efectivo' }].map(m => (
                      <button key={m.id} onClick={() => setMetodoPago(m.id)} style={{
                        flex: 1, padding: '12px 0', borderRadius: 10,
                        border: metodoPago === m.id ? '2px solid var(--c-accent)' : '1px solid var(--c-border)',
                        background: metodoPago === m.id ? 'var(--c-accent-light)' : 'rgba(255,255,255,0.08)',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        color: metodoPago === m.id ? 'var(--c-accent)' : 'var(--c-text)',
                      }}>{m.l}</button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--c-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Subtotal</span><span>{total.toFixed(2)} €</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Envio</span><span style={{ fontWeight: 600, color: tipoEntrega === 'recogida' ? '#22C55E' : 'var(--c-muted)' }}>{tipoEntrega === 'recogida' ? 'Gratis' : `${envioFinal.toFixed(2)} €`}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, marginTop: 12, paddingTop: 12, borderTop: '2px solid var(--c-border)', color: 'var(--c-text)' }}>
                  <span>Total</span><span>{totalFinal.toFixed(2)} €</span>
                </div>

                <button onClick={iniciarPago} disabled={loading} style={{
                  width: '100%', marginTop: 20, padding: '16px 0', borderRadius: 14, border: 'none',
                  background: loading ? 'var(--c-muted)' : 'var(--c-accent)', color: '#fff',
                  fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
                }}>
                  {loading ? 'Conectando...' : metodoPago === 'tarjeta' ? `Continuar al pago — ${totalFinal.toFixed(2)} €` : `Pedir ahora — ${totalFinal.toFixed(2)} €`}
                </button>

                {soloRecogida && (
                  <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🛵</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text)' }}>¿Quieres que te lo lleven?</div>
                      <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>Pide desde la app PIDO</div>
                    </div>
                    <button style={{ background: 'var(--c-accent)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Abrir PIDO</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// --- APP PRINCIPAL ---
export default function App() {
  const [socio, setSocio] = useState(null)
  const [establecimientos, setEstablecimientos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [catActiva, setCatActiva] = useState(null)
  const [resenasSocio, setResenasSocio] = useState([])
  const [resenasEst, setResenasEst] = useState([])
  const [establecimientoOpen, setEstablecimientoOpen] = useState(null)
  const [carrito, setCarrito] = useState([])
  const [shareOpen, setShareOpen] = useState(false)
  const [showRiderReviews, setShowRiderReviews] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { fetchSocio() }, [])

  async function fetchSocio() {
    // Obtener slug de la URL
    const path = window.location.pathname.replace(/^\//, '')
    const slug = path || 'demo'

    const { data: socioData, error: socioErr } = await supabase
      .from('socios')
      .select('*')
      .eq('slug', slug)
      .single()

    if (socioErr || !socioData) {
      setError('Tienda no encontrada')
      setLoading(false)
      return
    }

    setSocio(socioData)

    // Cargar establecimientos del socio
    const { data: relaciones } = await supabase
      .from('socio_establecimiento')
      .select('establecimiento_id, destacado')
      .eq('socio_id', socioData.id)
      .eq('estado', 'aceptado')

    if (relaciones && relaciones.length > 0) {
      const estIds = relaciones.map(r => r.establecimiento_id)
      const { data: ests } = await supabase
        .from('establecimientos')
        .select('*')
        .in('id', estIds)
        .eq('activo', true)

      // Marcar destacados
      const estsConDestacado = (ests || []).map(e => ({
        ...e,
        destacado: relaciones.find(r => r.establecimiento_id === e.id)?.destacado || false,
      }))
      setEstablecimientos(estsConDestacado)

      // Cargar categorias de todos los establecimientos del socio
      const { data: cats } = await supabase
        .from('categorias')
        .select('*')
        .in('establecimiento_id', estIds)
        .eq('activa', true)
        .order('orden')
      // Obtener nombres unicos
      const nombresUnicos = [...new Set((cats || []).map(c => c.nombre))]
      setCategorias(nombresUnicos)
    }

    // Cargar reseñas del socio
    const { data: resSocio } = await supabase
      .from('resenas')
      .select('*')
      .eq('socio_id', socioData.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setResenasSocio(resSocio || [])

    setLoading(false)
  }

  async function loadResenasEstablecimiento(estId) {
    const { data } = await supabase
      .from('resenas')
      .select('*')
      .eq('establecimiento_id', estId)
      .order('created_at', { ascending: false })
      .limit(10)
    setResenasEst(data || [])
  }

  function openEstablecimiento(est) {
    setEstablecimientoOpen(est)
    loadResenasEstablecimiento(est.id)
  }

  if (loading) {
    return (
      <div style={{ ...shellStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--c-accent)' }}>Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...shellStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text)' }}>{error}</div>
        <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>Verifica la URL e inténtalo de nuevo</div>
      </div>
    )
  }

  const redes = socio.redes || {}
  const destacados = establecimientos.filter(e => e.destacado)
  const esRecogida = socio.modo_entrega === 'recogida'

  return (
    <div style={{ ...shellStyle, minHeight: '100vh', position: 'relative', paddingBottom: 80 }}>
      <style>{globalCss}</style>

      {/* Banner */}
      <div style={{
        height: 180,
        background: socio.banner_url ? `url(${socio.banner_url}) center/cover` : 'linear-gradient(135deg, #FF5733 0%, #FF8F73 50%, #FFC4A8 100%)',
        position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '0 20px 16px',
      }}>
        {/* Redes sociales */}
        <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
          {redes.instagram && (
            <a href={`https://instagram.com/${redes.instagram}`} target="_blank" rel="noopener noreferrer"
              style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/></svg>
            </a>
          )}
          {redes.tiktok && (
            <a href={`https://tiktok.com/@${redes.tiktok}`} target="_blank" rel="noopener noreferrer"
              style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#fff', fontSize: 14, fontWeight: 700 }}>
              T
            </a>
          )}
          {redes.whatsapp && (
            <a href={`https://wa.me/${(redes.whatsapp || '').replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer"
              style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 16 }}>
              💬
            </a>
          )}
        </div>
        <button onClick={() => setShareOpen(true)} style={{
          position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.25)',
          border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
          fontSize: 12, fontWeight: 600, color: '#fff', backdropFilter: 'blur(8px)', fontFamily: 'inherit',
        }}>Compartir ↗</button>
      </div>

      {/* Logo + Nombre + Rating */}
      <div style={{ padding: '0 20px', marginTop: -48, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 22, background: '#fff',
          border: '4px solid #fff', boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 800, color: 'var(--c-accent)', overflow: 'hidden',
        }}>
          {socio.logo_url
            ? <img src={socio.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : socio.nombre_comercial?.[0]?.toUpperCase() || 'P'
          }
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 12, letterSpacing: -0.5, textAlign: 'center' }}>{socio.nombre_comercial}</h1>
        <p style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 2, textAlign: 'center' }}>pido.com/{socio.slug}</p>

        <button onClick={() => setShowRiderReviews(!showRiderReviews)} style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
          background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          borderRadius: 50, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Stars rating={socio.rating} size={13} />
          <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>({socio.total_resenas} reseñas)</span>
          <span style={{ fontSize: 10, color: 'var(--c-muted)', transform: showRiderReviews ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
        </button>

        <ModoEntregaBadge modo={socio.modo_entrega} radioKm={socio.radio_km} />
      </div>

      {/* Contenido */}
      <div style={{ padding: '0 20px', marginTop: 20 }}>
        {/* Reseñas del socio (expandibles) */}
        {showRiderReviews && !establecimientoOpen && resenasSocio.length > 0 && (
          <div style={{ animation: 'fadeIn 0.3s ease', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: 'var(--c-text)' }}>Reseñas de {socio.nombre_comercial}</h3>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
              {resenasSocio.map(r => <ResenaCard key={r.id} r={r} />)}
            </div>
          </div>
        )}

        {establecimientoOpen ? (
          <EstablecimientoDetail
            est={establecimientoOpen}
            onBack={() => setEstablecimientoOpen(null)}
            carrito={carrito} setCarrito={setCarrito}
            modoEntrega={socio.modo_entrega}
            resenas={resenasEst}
          />
        ) : (
          <>
            {esRecogida && <BannerPidoApp />}

            {destacados.length > 0 && (
              <div style={{ marginBottom: 28, animation: 'fadeIn 0.4s ease' }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14, letterSpacing: -0.3 }}>Restaurantes destacados</h2>
                <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
                  {destacados.map(r => (
                    <div key={r.id} style={{ minWidth: 220, flexShrink: 0 }}>
                      <EstablecimientoCard r={r} onOpen={openEstablecimiento} modoEntrega={socio.modo_entrega} socioEnServicio={socio.en_servicio} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categorias como filtros */}
            {categorias.length > 0 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
                <button onClick={() => setCatActiva(null)} style={{
                  padding: '8px 16px', borderRadius: 50, border: 'none', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                  background: !catActiva ? 'var(--c-accent)' : 'var(--c-surface)',
                  color: !catActiva ? '#fff' : 'var(--c-muted)',
                  boxShadow: !catActiva ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                }}>Todos</button>
                {categorias.map(cat => (
                  <button key={cat} onClick={() => setCatActiva(catActiva === cat ? null : cat)} style={{
                    padding: '8px 16px', borderRadius: 50, border: 'none', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                    background: catActiva === cat ? 'var(--c-accent)' : 'var(--c-surface)',
                    color: catActiva === cat ? '#fff' : 'var(--c-muted)',
                    boxShadow: catActiva === cat ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                  }}>{cat}</button>
                ))}
              </div>
            )}

            <div style={{ animation: 'fadeIn 0.4s ease 0.1s both' }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14, letterSpacing: -0.3 }}>
                {establecimientos.length > 0 ? 'Todos los restaurantes' : 'Sin restaurantes aun'}
              </h2>
              {establecimientos.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>
                  <div style={{ fontSize: 14 }}>Esta tienda aun no tiene restaurantes</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {establecimientos.map(r => (
                  <EstablecimientoCard key={r.id} r={r} onOpen={openEstablecimiento} modoEntrega={socio.modo_entrega} socioEnServicio={socio.en_servicio} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <CarritoBar carrito={carrito} setCarrito={setCarrito} modoEntrega={socio.modo_entrega} socioId={socio.id} socioNombre={socio.nombre_comercial} socioEnServicio={socio.en_servicio} />
      {shareOpen && <ShareModal slug={socio.slug} onClose={() => setShareOpen(false)} />}
    </div>
  )
}

const shellStyle = {
  '--c-accent': '#FF5733',
  '--c-accent-light': 'rgba(255,87,51,0.15)',
  '--c-accent-soft': 'rgba(255,87,51,0.25)',
  '--c-bg': '#0D0D0D',
  '--c-surface': 'rgba(255,255,255,0.08)',
  '--c-surface2': 'rgba(255,255,255,0.05)',
  '--c-border': 'rgba(255,255,255,0.1)',
  '--c-text': '#F5F5F5',
  '--c-muted': 'rgba(255,255,255,0.45)',
  fontFamily: "'DM Sans', sans-serif",
  maxWidth: 420,
  margin: '0 auto',
  background: 'var(--c-bg)',
  color: 'var(--c-text)',
}

const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{display:none}
body{background:#0D0D0D;margin:0}
`
