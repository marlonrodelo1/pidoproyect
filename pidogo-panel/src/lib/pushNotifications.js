import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'

export async function registerPushNotifications(onNotification) {
  if (!Capacitor.isNativePlatform()) return null
  const perm = await PushNotifications.requestPermissions()
  if (perm.receive !== 'granted') return null
  await PushNotifications.register()

  let token = null
  PushNotifications.addListener('registration', t => { token = t.value })
  PushNotifications.addListener('pushNotificationReceived', n => { if (onNotification) onNotification(n) })
  PushNotifications.addListener('pushNotificationActionPerformed', a => { if (onNotification) onNotification(a.notification, true) })
  return token
}

export async function unregisterPushNotifications() {
  if (!Capacitor.isNativePlatform()) return
  await PushNotifications.removeAllListeners()
}
