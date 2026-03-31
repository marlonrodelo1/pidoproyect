let audioContext = null
let alarmInterval = null
let isPlaying = false
let audioUnlocked = false

export function unlockAudio() {
  if (audioUnlocked) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
    ctx.close()
    audioUnlocked = true
  } catch {}
}

export async function startAlarm() {
  if (isPlaying) return
  stopAlarm()
  isPlaying = true

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()

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
    // Primer tono
    playBeep(ctx, 900, 0.25, 1.0)
    // Segundo tono mas alto
    setTimeout(() => {
      if (isPlaying && ctx.state !== 'closed') {
        playBeep(ctx, 1300, 0.25, 1.0)
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
