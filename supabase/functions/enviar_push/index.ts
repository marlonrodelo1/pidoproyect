import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { encode as base64url } from 'https://deno.land/std@0.177.0/encoding/base64url.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- FCM v1 API ---
async function getAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')!
  const privateKeyPem = Deno.env.get('FIREBASE_PRIVATE_KEY')!

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  }

  const headerB64 = base64url(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(payload)))
  const unsignedToken = `${headerB64}.${payloadB64}`

  // Import private key
  const pemContent = privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\n/g, '')
  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsignedToken))
  const signatureB64 = base64url(new Uint8Array(signature))
  const jwt = `${unsignedToken}.${signatureB64}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const tokenData = await tokenRes.json()
  return tokenData.access_token
}

async function sendFCM(fcmToken: string, title: string, body: string, data: Record<string, string> = {}) {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID')!
  const accessToken = await getAccessToken()

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token: fcmToken,
        notification: { title, body },
        data,
        android: { priority: 'high', notification: { sound: 'default', channel_id: 'pedidos' } },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      },
    }),
  })
  return res.ok
}

// --- Web Push ---
async function sendWebPush(endpoint: string, payload: string) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'TTL': '86400' },
      body: payload,
    })
    return res.ok
  } catch { return false }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { target_type, target_id, title, body, data } = await req.json()

    // Buscar suscripciones
    let query = supabase.from('push_subscriptions').select('*')
    if (target_type === 'cliente' && target_id) query = query.eq('user_id', target_id).eq('user_type', 'cliente')
    else if (target_type === 'restaurante' && target_id) query = query.eq('establecimiento_id', target_id).eq('user_type', 'restaurante')
    else if (target_type === 'socio' && target_id) query = query.eq('socio_id', target_id).eq('user_type', 'socio')

    const { data: subs } = await query
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let sent = 0
    const failed: string[] = []
    const payload = JSON.stringify({ title, body, data: data || {} })

    for (const sub of subs) {
      let ok = false
      // Intentar FCM primero si tiene token
      if (sub.fcm_token) {
        try { ok = await sendFCM(sub.fcm_token, title, body, data || {}) } catch {}
      }
      // Fallback a Web Push
      if (!ok && sub.endpoint) {
        ok = await sendWebPush(sub.endpoint, payload)
      }
      if (ok) sent++
      else failed.push(sub.id)
    }

    // Limpiar suscripciones inválidas
    if (failed.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', failed)
    }

    // Guardar en notificaciones si es para cliente
    if (target_type === 'cliente' && target_id) {
      await supabase.from('notificaciones').insert({ usuario_id: target_id, titulo: title, descripcion: body, leida: false })
    }

    return new Response(JSON.stringify({ sent, total: subs.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
