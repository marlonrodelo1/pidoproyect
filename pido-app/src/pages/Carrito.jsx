import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { crearPagoStripe } from '../lib/stripe'

export default function Carrito({ onPedidoCreado }) {
  const { user } = useAuth()
  const { carrito, removeItem, clearCart, propina, setPropina, metodoPago, setMetodoPago, modoEntrega, setModoEntrega, totalItems, subtotal, envio, total } = useCart()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (totalItems === 0) return null

  async function hacerPedido() {
    setLoading(true)
    try {
      const codigo = `PD-${Date.now()}`

      // Si paga con tarjeta, crear PaymentIntent en Stripe primero
      let stripePayment = null
      if (metodoPago === 'tarjeta') {
        try {
          stripePayment = await crearPagoStripe({
            amount: total,
            pedidoCodigo: codigo,
            customerEmail: user?.email,
          })
        } catch (e) {
          console.warn('Stripe no disponible, continuando...', e)
        }
      }

      // Buscar socio activo mas cercano para asignar al pedido
      let socioAsignado = null
      if (modoEntrega === 'delivery') {
        const estId = carrito[0].establecimiento_id
        const { data: relaciones } = await supabase
          .from('socio_establecimiento')
          .select('socio_id')
          .eq('establecimiento_id', estId)
          .eq('estado', 'aceptado')

        if (relaciones && relaciones.length > 0) {
          const socioIds = relaciones.map(r => r.socio_id)
          const { data: sociosActivos } = await supabase
            .from('socios')
            .select('id')
            .in('id', socioIds)
            .eq('activo', true)
            .eq('en_servicio', true)
            .limit(1)
          if (sociosActivos && sociosActivos.length > 0) {
            socioAsignado = sociosActivos[0].id
          }
        }
      }

      // Crear pedido
      const { data: pedido, error: pedidoError } = await supabase.from('pedidos').insert({
        codigo,
        usuario_id: user?.id || null,
        establecimiento_id: carrito[0].establecimiento_id,
        socio_id: socioAsignado,
        canal: 'pido',
        estado: 'nuevo',
        metodo_pago: metodoPago,
        subtotal,
        coste_envio: envio,
        propina,
        total,
        notas: '',
      }).select().single()

      if (pedidoError) throw pedidoError

      // Crear items
      const items = carrito.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.producto_id,
        nombre_producto: item.nombre,
        tamano: item.tamano,
        extras: item.extras,
        precio_unitario: item.precio_unitario,
        cantidad: item.cantidad,
      }))

      await supabase.from('pedido_items').insert(items)

      clearCart()
      setOpen(false)
      onPedidoCreado({ ...pedido, stripeClientSecret: stripePayment?.clientSecret })
    } catch (err) {
      alert('Error al crear pedido: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Barra flotante */}
      <div onClick={() => setOpen(true)} style={{
        position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)',
        background: 'var(--c-primary)', color: '#fff', borderRadius: 16,
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, minWidth: 300, maxWidth: 380, cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 50, fontFamily: 'inherit',
      }}>
        <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '2px 10px', fontWeight: 700, fontSize: 14 }}>{totalItems}</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Ver carrito</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{total.toFixed(2)} €</span>
      </div>

      {/* Modal carrito */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--c-bg)', borderRadius: '24px 24px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--c-text)' }}>Tu pedido</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--c-muted)' }}>×</button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 14 }}>{carrito[0]?.establecimiento_nombre}</div>

            {/* Items */}
            {carrito.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--c-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>{item.cantidad}x {item.nombre}</div>
                  {item.tamano && <div style={{ fontSize: 10, color: 'var(--c-muted)' }}>{item.tamano}</div>}
                  {item.extras?.length > 0 && <div style={{ fontSize: 10, color: 'var(--c-muted)' }}>{item.extras.join(', ')}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)' }}>{(item.precio_unitario * item.cantidad).toFixed(2)} €</span>
                  <button onClick={() => removeItem(idx)} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--c-border)', background: 'var(--c-surface)', cursor: 'pointer', fontSize: 10, color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              </div>
            ))}

            {/* Tipo de entrega */}
            <div style={{ marginTop: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>Tipo de entrega</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setModoEntrega('delivery')} style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: modoEntrega === 'delivery' ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
                  background: modoEntrega === 'delivery' ? 'var(--c-primary-light)' : 'var(--c-surface)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  color: modoEntrega === 'delivery' ? 'var(--c-primary)' : 'var(--c-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 16 }}>🛵</span> Delivery
                </button>
                <button onClick={() => setModoEntrega('recogida')} style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: modoEntrega === 'recogida' ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
                  background: modoEntrega === 'recogida' ? 'var(--c-primary-light)' : 'var(--c-surface)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  color: modoEntrega === 'recogida' ? 'var(--c-primary)' : 'var(--c-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 16 }}>🏪</span> Recogida
                </button>
              </div>
              {modoEntrega === 'recogida' && (
                <div style={{ fontSize: 11, color: 'var(--c-primary)', fontWeight: 600, marginTop: 6 }}>
                  Recogelo en el restaurante · Sin coste de envio
                </div>
              )}
            </div>

            {/* Propina */}
            <div style={{ marginTop: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>Propina</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 1, 2, 3].map(p => (
                  <button key={p} onClick={() => setPropina(p)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    border: propina === p ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
                    background: propina === p ? 'var(--c-primary-light)' : 'var(--c-surface)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    color: propina === p ? 'var(--c-primary)' : 'var(--c-text)',
                  }}>{p === 0 ? 'No' : `${p} €`}</button>
                ))}
              </div>
            </div>

            {/* Método pago */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>Método de pago</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'tarjeta', l: '💳 Tarjeta' }, { id: 'efectivo', l: '💵 Efectivo' }].map(m => (
                  <button key={m.id} onClick={() => setMetodoPago(m.id)} style={{
                    flex: 1, padding: '12px 0', borderRadius: 10,
                    border: metodoPago === m.id ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
                    background: metodoPago === m.id ? 'var(--c-primary-light)' : 'var(--c-surface)',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    color: metodoPago === m.id ? 'var(--c-primary)' : 'var(--c-text)',
                  }}>{m.l}</button>
                ))}
              </div>
            </div>

            {/* Desglose */}
            <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Subtotal</span><span>{subtotal.toFixed(2)} €</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Envio</span><span style={{ color: modoEntrega === 'recogida' ? '#22C55E' : 'inherit', fontWeight: modoEntrega === 'recogida' ? 700 : 400 }}>{modoEntrega === 'recogida' ? 'Gratis' : `${envio.toFixed(2)} €`}</span></div>
              {propina > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#F59E0B' }}><span>Propina</span><span>{propina} €</span></div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--c-border)', color: 'var(--c-text)' }}>
              <span>Total</span><span>{total.toFixed(2)} €</span>
            </div>

            <button onClick={hacerPedido} disabled={loading} style={{
              width: '100%', marginTop: 16, padding: '16px 0', borderRadius: 14, border: 'none',
              background: loading ? 'var(--c-muted)' : 'var(--c-primary)', color: '#fff',
              fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
            }}>
              {loading ? 'Procesando...' : `Pedir ahora — ${total.toFixed(2)} €`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
