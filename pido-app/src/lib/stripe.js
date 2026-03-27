const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function callStripe(body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/crear_pago_stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al procesar el pago')
  return data
}

export async function crearPagoStripe({ amount, pedidoCodigo, customerEmail, userId }) {
  const data = await callStripe({
    amount, currency: 'eur',
    pedido_codigo: pedidoCodigo,
    customer_email: customerEmail,
    user_id: userId,
  })
  if (!data.clientSecret) throw new Error('No se recibió respuesta del sistema de pagos')
  return data
}

export async function listarTarjetas(userId) {
  const data = await callStripe({ action: 'list_cards', user_id: userId })
  return data.cards || []
}

export async function pagarConTarjetaGuardada({ paymentMethodId, amount, pedidoCodigo, customerEmail, userId }) {
  return await callStripe({
    action: 'pay_saved',
    payment_method_id: paymentMethodId,
    amount, currency: 'eur',
    pedido_codigo: pedidoCodigo,
    customer_email: customerEmail,
    user_id: userId,
  })
}
