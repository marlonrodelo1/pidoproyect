import { LocalNotifications } from '@capacitor/local-notifications'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

// Audio context para sonido de alarma
let audioContext = null
let alarmInterval = null

/**
 * Reproduce un sonido de alarma repetido para pedidos nuevos.
 * Usa Web Audio API + vibración + notificación local.
 */
export async function startAlarm() {
  // Vibración háptica
  if (Capacitor.isNativePlatform()) {
    try { await Haptics.impact({ style: ImpactStyle.Heavy }) } catch {}
  }

  // Notificación local
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.requestPermissions()
      await LocalNotifications.schedule({
        notifications: [{
          id: 9999,
          title: 'Nuevo pedido',
          body: 'Tienes un pedido esperando respuesta',
          sound: 'alarm.wav',
          smallIcon: 'ic_stat_icon',
          actionTypeId: 'OPEN_ORDER',
        }],
      })
    } catch {}
  }

  // Web Audio API - tono de alarma
  stopAlarm()
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    alarmInterval = setInterval(() => {
      playBeep(audioContext, 880, 0.15)
      setTimeout(() => playBeep(audioContext, 1100, 0.15), 200)
    }, 1500)
  } catch {}
}

/**
 * Detiene la alarma.
 */
export function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
  if (audioContext) {
    audioContext.close().catch(() => {})
    audioContext = null
  }
}

/**
 * Reproduce un beep corto usando Web Audio API.
 */
function playBeep(ctx, frequency, duration) {
  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {}
}
