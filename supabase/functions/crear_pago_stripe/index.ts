import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY no configurada')

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, amount, currency = 'eur', pedido_codigo, customer_email, user_id, payment_method_id } = await req.json()

    // --- Listar tarjetas guardadas ---
    if (action === 'list_cards') {
      if (!user_id) throw new Error('user_id requerido')
      const { data: usuario } = await supabase.from('usuarios').select('stripe_customer_id').eq('id', user_id).single()
      if (!usuario?.stripe_customer_id) {
        return new Response(JSON.stringify({ cards: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const paymentMethods = await stripe.paymentMethods.list({ customer: usuario.stripe_customer_id, type: 'card' })
      const cards = paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
      }))
      return new Response(JSON.stringify({ cards }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- Pagar con tarjeta guardada ---
    if (action === 'pay_saved') {
      if (!user_id || !payment_method_id || !amount) throw new Error('Faltan datos')
      const { data: usuario } = await supabase.from('usuarios').select('stripe_customer_id').eq('id', user_id).single()
      if (!usuario?.stripe_customer_id) throw new Error('No hay cliente Stripe')

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        customer: usuario.stripe_customer_id,
        payment_method: payment_method_id,
        off_session: false,
        confirm: true,
        metadata: { pedido_codigo: pedido_codigo || '' },
        receipt_email: customer_email || undefined,
      })

      return new Response(JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- Crear pago nuevo (guardar tarjeta para futuro) ---
    if (!amount || amount <= 0) throw new Error('amount debe ser mayor a 0')

    // Obtener o crear Stripe Customer
    let customerId = null
    if (user_id) {
      const { data: usuario } = await supabase.from('usuarios').select('stripe_customer_id').eq('id', user_id).single()
      if (usuario?.stripe_customer_id) {
        customerId = usuario.stripe_customer_id
      } else {
        const customer = await stripe.customers.create({
          email: customer_email || undefined,
          metadata: { user_id },
        })
        customerId = customer.id
        await supabase.from('usuarios').update({ stripe_customer_id: customerId }).eq('id', user_id)
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      customer: customerId || undefined,
      setup_future_usage: customerId ? 'on_session' : undefined,
      metadata: { pedido_codigo: pedido_codigo || '' },
      receipt_email: customer_email || undefined,
      automatic_payment_methods: { enabled: true },
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
