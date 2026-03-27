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

  if (error) throw new Error(error.message || 'Error al crear pago')
  return data
}
