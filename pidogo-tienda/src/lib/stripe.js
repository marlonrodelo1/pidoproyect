const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function crearPagoStripe({ amount, pedidoCodigo, customerEmail }) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/crear_pago_stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      amount,
      currency: 'eur',
      pedido_codigo: pedidoCodigo,
      customer_email: customerEmail,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error al procesar el pago')
  }

  if (!data.clientSecret) {
    throw new Error('No se recibió respuesta del sistema de pagos')
  }

  return data
}
