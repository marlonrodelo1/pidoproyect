let audioContext = null
let alarmInterval = null
let isPlaying = false
let audioUnlocked = false

/**
 * Desbloquea AudioContext en respuesta a interacción del usuario.
 * Llamar al primer click/touch en la app.
 */
export function unlockAudio() {
  if (audioUnlocked) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Crear un buffer silencioso para desbloquear
    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
    ctx.close()
    audioUnlocked = true
  } catch {}
}

/**
 * Alarma fuerte y constante para pedidos nuevos.
 * Suena cada 600ms con tono alto hasta que se detenga.
 * Incluye fallback con Notification API si el audio no funciona.
 */
export async function startAlarm() {
  if (isPlaying) return
  stopAlarm()
  isPlaying = true

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Si el contexto está suspendido (restricción del navegador), intentar resumir
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    // Sonar inmediatamente
    playAlarmTone(audioContext)

    // Repetir cada 600ms (constante y urgente)
    alarmInterval = setInterval(() => {
      if (audioContext && isPlaying) {
        playAlarmTone(audioContext)
      }
    }, 600)
  } catch (e) {
    console.warn('Audio no disponible:', e)
    // Fallback: notificación del navegador
    showNotification()
  }
}

/**
 * Detiene la alarma.
 */
export function stopAlarm() {
  isPlaying = false
  if (alarmInterval) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
  if (audioContext) {
    try { audioContext.close() } catch {}
    audioContext = null
  }
}

/**
 * Tono de alarma fuerte: dos frecuencias alternadas tipo sirena.
 */
function playAlarmTone(ctx) {
  try {
    if (ctx.state === 'closed') return
    // Primer tono - alto
    playBeep(ctx, 1000, 0.25, 1.0)
    // Segundo tono - mas alto, con delay
    setTimeout(() => {
      if (isPlaying && ctx.state !== 'closed') {
        playBeep(ctx, 1400, 0.25, 1.0)
      }
    }, 280)
  } catch {}
}

function playBeep(ctx, frequency, duration, volume) {
  try {
    if (ctx.state === 'closed') return
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.value = frequency
    oscillator.type = 'square'
    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {}
}

/**
 * Fallback: enviar notificación del navegador si el audio no funciona.
 */
function showNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Nuevo pedido en pidoo', {
      body: 'Tienes un pedido nuevo esperando',
      icon: '/favicon.ico',
      requireInteraction: true,
    })
  }
}

/**
 * Solicitar permiso de notificaciones al inicio.
 */
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}
