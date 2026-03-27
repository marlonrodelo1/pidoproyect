import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'

/**
 * Registra el dispositivo para recibir push notifications (Firebase).
 * Devuelve el token FCM para guardarlo en el backend.
 */
export async function registerPushNotifications(onNotification) {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications solo disponibles en nativo')
    return null
  }

  // Solicitar permiso
  const perm = await PushNotifications.requestPermissions()
  if (perm.receive !== 'granted') {
    console.warn('Permiso de notificaciones denegado')
    return null
  }

  // Registrar
  await PushNotifications.register()

  // Listener para obtener el token
  let token = null
  PushNotifications.addListener('registration', (t) => {
    token = t.value
    console.log('FCM Token:', token)
  })

  PushNotifications.addListener('registrationError', (err) => {
    console.error('Error registrando push:', err)
  })

  // Listener para notificaciones recibidas (app en primer plano)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push recibida:', notification)
    if (onNotification) onNotification(notification)
  })

  // Listener para cuando el usuario toca la notificación
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action:', action)
    if (onNotification) onNotification(action.notification, true)
  })

  return token
}

/**
 * Elimina todos los listeners de push notifications.
 */
export async function unregisterPushNotifications() {
  if (!Capacitor.isNativePlatform()) return
  await PushNotifications.removeAllListeners()
}
