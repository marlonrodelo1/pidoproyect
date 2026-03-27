import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { crearPagoStripe, listarTarjetas, pagarConTarjetaGuardada } from '../lib/stripe'
import { CreditCard, Lock, X, ArrowLeft, Check } from 'lucide-react'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const cardStyle = {
  style: {
    base: { fontSize: '16px', fontFamily: "'DM Sans', sans-serif", color: '#F5F5F5', '::placeholder': { color: 'rgba(255,255,255,0.3)' } },
    invalid: { color: '#EF4444' },
  },
}

function FormularioPago({ clientSecret, total, onSuccess, onCancel }) {
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
    } else { setError('El pago no se pudo completar'); setLoading(false) }
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--c-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16, padding: 0 }}>
        <ArrowLeft size={16} strokeWidth={2.5} /> Volver al carrito
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,107,44,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CreditCard size={20} strokeWidth={1.8} color="var(--c-primary)" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#F5F5F5' }}>Nueva tarjeta</div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>Se guardará para próximos pedidos</div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', padding: '16px 14px', marginBottom: 16 }}>
        <CardElement options={cardStyle} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
        <Lock size={12} strokeWidth={2} color="var(--c-muted)" />
        <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>Pago seguro · Tu tarjeta se guardará para próximos pedidos</span>
      </div>
      {error && <div style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 12, textAlign: 'center', fontWeight: 600 }}>{error}</div>}
      <button onClick={handlePagar} disabled={loading || !stripe} style={{
        width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
        background: loading ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff',
        fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
      }}>
        {loading ? 'Procesando pago...' : `Pagar ${total.toFixed(2)} €`}
      </button>
    </div>
  )
}

const brandIcon = { visa: '💳', mastercard: '💳', amex: '💳' }

export default function Carrito({ onPedidoCreado }) {
  const { user } = useAuth()
  const { carrito, removeItem, clearCart, propina, setPropina, metodoPago, setMetodoPago, modoEntrega, setModoEntrega, totalItems, subtotal, envio, total } = useCart()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pasoTarjeta, setPasoTarjeta] = useState(false)
  const [clientSecret, setClientSecret] = useState(null)
  const [codigoPedido, setCodigoPedido] = useState(null)
  const [tarjetasGuardadas, setTarjetasGuardadas] = useState([])
  const [tarjetaSel, setTarjetaSel] = useState(null)
  const [loadingCards, setLoadingCards] = useState(false)

  // Cargar tarjetas guardadas al abrir
  useEffect(() => {
    if (open && user?.id && metodoPago === 'tarjeta') {
      setLoadingCards(true)
      listarTarjetas(user.id).then(cards => {
        setTarjetasGuardadas(cards)
        if (cards.length > 0) setTarjetaSel(cards[0].id)
        setLoadingCards(false)
      }).catch(() => setLoadingCards(false))
    }
  }, [open, metodoPago])

  if (totalItems === 0) return null

  async function iniciarPago() {
    if (metodoPago === 'tarjeta') {
      setLoading(true)
      try {
        const codigo = `PD-${Date.now()}`
        setCodigoPedido(codigo)

        // Si tiene tarjeta guardada seleccionada, pagar directo
        if (tarjetaSel && tarjetasGuardadas.length > 0) {
          const result = await pagarConTarjetaGuardada({
            paymentMethodId: tarjetaSel,
            amount: total,
            pedidoCodigo: codigo,
            customerEmail: user?.email,
            userId: user?.id,
          })
          if (result.status === 'succeeded') {
            await crearPedido(result.paymentIntentId, codigo)
            return
          }
        }

        // Si no, mostrar formulario de nueva tarjeta
        const result = await crearPagoStripe({
          amount: total,
          pedidoCodigo: codigo,
          customerEmail: user?.email,
          userId: user?.id,
        })
        setClientSecret(result.clientSecret)
        setPasoTarjeta(true)
      } catch (e) {
        alert('Error: ' + e.message)
      } finally {
        setLoading(false)
      }
    } else {
      await crearPedido(null)
    }
  }

  async function crearPedido(stripePaymentId, codOverride) {
    setLoading(true)
    try {
      const codigo = codOverride || codigoPedido || `PD-${Date.now()}`
      let socioAsignado = null
      if (modoEntrega === 'delivery') {
        const estId = carrito[0].establecimiento_id
        const { data: relaciones } = await supabase.from('socio_establecimiento').select('socio_id').eq('establecimiento_id', estId).eq('estado', 'aceptado')
        if (relaciones && relaciones.length > 0) {
          const socioIds = relaciones.map(r => r.socio_id)
          const { data: sociosActivos } = await supabase.from('socios').select('id').in('id', socioIds).eq('activo', true).eq('en_servicio', true).limit(1)
          if (sociosActivos && sociosActivos.length > 0) socioAsignado = sociosActivos[0].id
        }
      }
      const { data: pedido, error: pedidoError } = await supabase.from('pedidos').insert({
        codigo, usuario_id: user?.id || null, establecimiento_id: carrito[0].establecimiento_id,
        socio_id: socioAsignado, canal: 'pido', estado: 'nuevo', metodo_pago: metodoPago,
        stripe_payment_id: stripePaymentId, subtotal, coste_envio: envio, propina, total, notas: '',
      }).select().single()
      if (pedidoError) throw pedidoError
      const items = carrito.map(item => ({
        pedido_id: pedido.id, producto_id: item.producto_id, nombre_producto: item.nombre,
        tamano: item.tamano, extras: item.extras, precio_unitario: item.precio_unitario, cantidad: item.cantidad,
      }))
      await supabase.from('pedido_items').insert(items)
      clearCart(); setOpen(false); setPasoTarjeta(false); setClientSecret(null); setCodigoPedido(null)
      onPedidoCreado(pedido)
    } catch (err) { alert('Error al crear pedido: ' + err.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      {/* Barra flotante */}
      <div onClick={() => setOpen(true)} style={{
        position: 'fixed', bottom: 82, left: '50%', transform: 'translateX(-50%)',
        background: 'var(--c-primary)', color: '#fff', borderRadius: 16,
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, minWidth: 300, maxWidth: 380, cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 50, fontFamily: 'inherit',
      }}>
        <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '2px 10px', fontWeight: 700, fontSize: 14 }}>{totalItems}</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Ver carrito</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{total.toFixed(2)} €</span>
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => { setOpen(false); setPasoTarjeta(false) }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1A1A1A', borderRadius: '24px 24px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp 0.3s ease', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>

            {pasoTarjeta && clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <FormularioPago clientSecret={clientSecret} total={total}
                  onSuccess={(paymentId) => crearPedido(paymentId)}
                  onCancel={() => setPasoTarjeta(false)} />
              </Elements>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#F5F5F5' }}>Tu pedido</h3>
                  <button onClick={() => setOpen(false)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={16} strokeWidth={2} color="#F5F5F5" />
                  </button>
                </div>

                <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 14 }}>{carrito[0]?.establecimiento_nombre}</div>

                {carrito.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#F5F5F5' }}>{item.cantidad}x {item.nombre}</div>
                      {item.tamano && <div style={{ fontSize: 10, color: 'var(--c-muted)' }}>{item.tamano}</div>}
                      {item.extras?.length > 0 && <div style={{ fontSize: 10, color: 'var(--c-muted)' }}>{item.extras.join(', ')}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#F5F5F5' }}>{(item.precio_unitario * item.cantidad).toFixed(2)} €</span>
                      <button onClick={() => removeItem(idx)} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 10, color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  </div>
                ))}

                {/* Entrega */}
                <div style={{ marginTop: 14, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5', marginBottom: 8 }}>Tipo de entrega</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['delivery', 'recogida'].map(m => (
                      <button key={m} onClick={() => setModoEntrega(m)} style={{
                        flex: 1, padding: '12px 0', borderRadius: 10,
                        border: modoEntrega === m ? '2px solid var(--c-primary)' : '1px solid rgba(255,255,255,0.1)',
                        background: modoEntrega === m ? 'rgba(255,107,44,0.12)' : 'rgba(255,255,255,0.04)',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        color: modoEntrega === m ? 'var(--c-primary)' : '#F5F5F5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <span style={{ fontSize: 16 }}>{m === 'delivery' ? '🛵' : '🏪'}</span> {m === 'delivery' ? 'Delivery' : 'Recogida'}
                      </button>
                    ))}
                  </div>
                  {modoEntrega === 'recogida' && <div style={{ fontSize: 11, color: 'var(--c-primary)', fontWeight: 600, marginTop: 6 }}>Sin coste de envio</div>}
                </div>

                {/* Propina */}
                <div style={{ marginTop: 14, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5', marginBottom: 8 }}>Propina</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[0, 1, 2, 3].map(p => (
                      <button key={p} onClick={() => setPropina(p)} style={{
                        flex: 1, padding: '10px 0', borderRadius: 10,
                        border: propina === p ? '2px solid var(--c-primary)' : '1px solid rgba(255,255,255,0.1)',
                        background: propina === p ? 'rgba(255,107,44,0.12)' : 'rgba(255,255,255,0.04)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        color: propina === p ? 'var(--c-primary)' : '#F5F5F5',
                      }}>{p === 0 ? 'No' : `${p} €`}</button>
                    ))}
                  </div>
                </div>

                {/* Método pago */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5', marginBottom: 8 }}>Método de pago</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ id: 'tarjeta', l: '💳 Tarjeta' }, { id: 'efectivo', l: '💵 Efectivo' }].map(m => (
                      <button key={m.id} onClick={() => setMetodoPago(m.id)} style={{
                        flex: 1, padding: '12px 0', borderRadius: 10,
                        border: metodoPago === m.id ? '2px solid var(--c-primary)' : '1px solid rgba(255,255,255,0.1)',
                        background: metodoPago === m.id ? 'rgba(255,107,44,0.12)' : 'rgba(255,255,255,0.04)',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        color: metodoPago === m.id ? 'var(--c-primary)' : '#F5F5F5',
                      }}>{m.l}</button>
                    ))}
                  </div>

                  {/* Tarjetas guardadas */}
                  {metodoPago === 'tarjeta' && tarjetasGuardadas.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 6 }}>Tarjetas guardadas</div>
                      {tarjetasGuardadas.map(c => (
                        <button key={c.id} onClick={() => setTarjetaSel(c.id)} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                          borderRadius: 10, marginBottom: 6, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          border: tarjetaSel === c.id ? '2px solid var(--c-primary)' : '1px solid rgba(255,255,255,0.1)',
                          background: tarjetaSel === c.id ? 'rgba(255,107,44,0.08)' : 'rgba(255,255,255,0.04)',
                        }}>
                          <span style={{ fontSize: 20 }}>💳</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#F5F5F5', textTransform: 'capitalize' }}>{c.brand} </span>
                            <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>•••• {c.last4}</span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>{c.exp_month}/{c.exp_year}</span>
                          {tarjetaSel === c.id && <Check size={16} color="var(--c-primary)" />}
                        </button>
                      ))}
                      <button onClick={() => { setTarjetaSel(null) }} style={{
                        width: '100%', padding: '8px', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.15)',
                        background: 'transparent', color: 'var(--c-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        + Usar nueva tarjeta
                      </button>
                    </div>
                  )}
                </div>

                {/* Desglose */}
                <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Subtotal</span><span>{subtotal.toFixed(2)} €</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Envio</span><span style={{ color: modoEntrega === 'recogida' ? '#22C55E' : 'inherit', fontWeight: modoEntrega === 'recogida' ? 700 : 400 }}>{modoEntrega === 'recogida' ? 'Gratis' : `${envio.toFixed(2)} €`}</span></div>
                  {propina > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#FBBF24' }}><span>Propina</span><span>{propina} €</span></div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, marginTop: 10, paddingTop: 10, borderTop: '2px solid rgba(255,255,255,0.08)', color: '#F5F5F5' }}>
                  <span>Total</span><span>{total.toFixed(2)} €</span>
                </div>

                <button onClick={iniciarPago} disabled={loading} style={{
                  width: '100%', marginTop: 16, padding: '16px 0', borderRadius: 14, border: 'none',
                  background: loading ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff',
                  fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
                }}>
                  {loading ? 'Procesando...' : metodoPago === 'tarjeta' && tarjetaSel ? `Pagar con •••• ${tarjetasGuardadas.find(c => c.id === tarjetaSel)?.last4} — ${total.toFixed(2)} €` : metodoPago === 'tarjeta' ? `Continuar al pago — ${total.toFixed(2)} €` : `Pedir ahora — ${total.toFixed(2)} €`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
