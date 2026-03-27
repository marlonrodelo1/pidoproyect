import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = 'BFc2_2AqX_We097SS8IcTj994HE9gwmZMZoVEEnobG6fs6ts3LzYu-f-kZFZ9KWYmLx3iet81mQD6JErQFoK8v4'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

/**
 * Registra el Service Worker y suscribe a push notifications.
 * Guarda la suscripción en Supabase.
 * @param {string} userType - 'cliente' | 'restaurante' | 'socio'
 * @param {object} ids - { user_id, establecimiento_id, socio_id }
 */
export async function registerWebPush(userType, ids = {}) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications no soportadas en este navegador')
    return false
  }

  try {
    // Pedir permiso
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Permiso de notificaciones denegado')
      return false
    }

    // Registrar Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    // Suscribir a push
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    const sub = subscription.toJSON()

    // Guardar en Supabase
    await supabase.from('push_subscriptions').upsert({
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_type: userType,
      user_id: ids.user_id || null,
      establecimiento_id: ids.establecimiento_id || null,
      socio_id: ids.socio_id || null,
    }, { onConflict: 'endpoint' })

    console.log('Push notifications registradas correctamente')
    return true
  } catch (err) {
    console.warn('Error registrando push:', err)
    return false
  }
}

/**
 * Envía una notificación push vía Edge Function.
 */
export async function sendPush({ targetType, targetId, title, body, data }) {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

  await fetch(`${SUPABASE_URL}/functions/v1/enviar_push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      target_type: targetType,
      target_id: targetId,
      title, body, data,
    }),
  })
}
