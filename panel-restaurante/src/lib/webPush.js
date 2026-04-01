import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { supabase } from './supabase'

const firebaseConfig = {
  apiKey: "AIzaSyC6z4uvYd1TVHzTN7zuE36R3nkiJBHx6rw",
  authDomain: "pidoo-push.firebaseapp.com",
  projectId: "pidoo-push",
  storageBucket: "pidoo-push.firebasestorage.app",
  messagingSenderId: "797553895667",
  appId: "1:797553895667:web:a2797733db94b6116daf86",
}

const VAPID_KEY = 'BCi6cNn5m6sQtE5c00relAV4Gy91ZaceufC-aqC4DjF0cU6WvX8qlOm1NjOrIEhk_x-y8sf67Z453XJopHlE7WY'

let messaging = null

function getFirebaseMessaging() {
  if (!messaging) {
    const app = initializeApp(firebaseConfig)
    messaging = getMessaging(app)
  }
  return messaging
}

/**
 * Registra Firebase Cloud Messaging y guarda el FCM token en Supabase.
 */
export async function registerWebPush(userType, ids = {}) {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.log('Push notifications no soportadas')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    // Registrar Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const msg = getFirebaseMessaging()

    // Obtener FCM token
    const fcmToken = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (fcmToken) {
      // Guardar FCM token en Supabase
      await supabase.from('push_subscriptions').upsert({
        fcm_token: fcmToken,
        endpoint: fcmToken,
        p256dh: '',
        auth: '',
        user_type: userType,
        user_id: ids.user_id || null,
        establecimiento_id: ids.establecimiento_id || null,
        socio_id: ids.socio_id || null,
      }, { onConflict: 'endpoint' })

      console.log('FCM token registrado:', fcmToken.substring(0, 20) + '...')
    }

    // Listener para mensajes en foreground
    onMessage(msg, (payload) => {
      const title = payload.notification?.title || 'Nuevo pedido'
      const body = payload.notification?.body || ''
      new Notification(title, { body, icon: '/favicon.png', requireInteraction: true })
    })

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
    body: JSON.stringify({ target_type: targetType, target_id: targetId, title, body, data }),
  })
}
