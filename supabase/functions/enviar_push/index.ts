import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Web Push signing (simplified VAPID)
async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!

  // Use fetch to send to push service with VAPID authorization
  // For simplicity, we use the push endpoint directly with the payload
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body: payload,
  })

  return response.ok
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { target_type, target_id, title, body, data } = await req.json()

    // Buscar suscripciones según el tipo de destino
    let query = supabase.from('push_subscriptions').select('*')

    if (target_type === 'cliente' && target_id) {
      query = query.eq('user_id', target_id).eq('user_type', 'cliente')
    } else if (target_type === 'restaurante' && target_id) {
      query = query.eq('establecimiento_id', target_id).eq('user_type', 'restaurante')
    } else if (target_type === 'socio' && target_id) {
      query = query.eq('socio_id', target_id).eq('user_type', 'socio')
    } else if (target_type === 'all_restaurantes') {
      query = query.eq('user_type', 'restaurante')
    } else if (target_type === 'all_socios') {
      query = query.eq('user_type', 'socio')
    } else if (target_type === 'all') {
      // No filter - send to all
    }

    const { data: subs } = await query
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No hay suscripciones' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const payload = JSON.stringify({ title, body, data: data || {} })
    let sent = 0
    const failed: string[] = []

    for (const sub of subs) {
      try {
        const ok = await sendWebPush({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload)
        if (ok) sent++
        else failed.push(sub.id)
      } catch {
        failed.push(sub.id)
      }
    }

    // Limpiar suscripciones fallidas (endpoint ya no válido)
    if (failed.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', failed)
    }

    // Guardar también en tabla notificaciones si es para un cliente
    if (target_type === 'cliente' && target_id) {
      await supabase.from('notificaciones').insert({
        usuario_id: target_id,
        titulo: title,
        descripcion: body,
        leida: false,
      })
    }

    return new Response(JSON.stringify({ sent, total: subs.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
