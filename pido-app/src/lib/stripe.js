import { supabase } from './supabase'

export async function crearPagoStripe({ amount, pedidoCodigo, customerEmail }) {
  const { data, error } = await supabase.functions.invoke('crear_pago_stripe', {
    body: {
      amount,
      currency: 'eur',
      pedido_codigo: pedidoCodigo,
      customer_email: customerEmail,
    },
  })

  if (error) {
    // Extraer mensaje útil del error
    const msg = error.message || 'Error al conectar con pagos'
    if (msg.includes('STRIPE_SECRET_KEY')) {
      throw new Error('El sistema de pagos no está configurado. Contacta con soporte.')
    }
    throw new Error(msg)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  if (!data?.clientSecret) {
    throw new Error('No se recibió respuesta del sistema de pagos')
  }

  return data
}
