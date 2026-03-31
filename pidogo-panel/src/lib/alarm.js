let audioContext = null
let alarmInterval = null
let isPlaying = false
let audioElement = null

function generateAlarmDataUrl() {
  const sampleRate = 22050
  const duration = 0.5
  const samples = sampleRate * duration
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)

  const writeString = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)) }
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, samples * 2, true)

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    const freq = t < 0.25 ? 900 : 1300
    const val = Math.sin(2 * Math.PI * freq * t) * 0.9
    view.setInt16(44 + i * 2, val * 32767, true)
  }

  const blob = new Blob([buffer], { type: 'audio/wav' })
  return URL.createObjectURL(blob)
}

export async function startAlarm() {
  if (isPlaying) return
  stopAlarm()
  isPlaying = true

  try {
    if (!audioElement) {
      audioElement = new Audio(generateAlarmDataUrl())
      audioElement.loop = true
      audioElement.volume = 1.0
    }
    const playPromise = audioElement.play()
    if (playPromise) {
      playPromise.catch(() => startWebAudioAlarm())
    }
    return
  } catch {}

  startWebAudioAlarm()
}

function startWebAudioAlarm() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    if (audioContext.state === 'suspended') audioContext.resume()

    playAlarmTone(audioContext)
    alarmInterval = setInterval(() => {
      if (audioContext && isPlaying) playAlarmTone(audioContext)
    }, 600)
  } catch {}
}

export function stopAlarm() {
  isPlaying = false

  if (audioElement) {
    audioElement.pause()
    audioElement.currentTime = 0
  }

  if (alarmInterval) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
  if (audioContext) {
    try { audioContext.close() } catch {}
    audioContext = null
  }
}

export function unlockAudio() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
    ctx.close()
  } catch {}

  if (!audioElement) {
    audioElement = new Audio(generateAlarmDataUrl())
    audioElement.loop = true
    audioElement.volume = 1.0
  }
}

function playAlarmTone(ctx) {
  try {
    if (ctx.state === 'closed') return
    playBeep(ctx, 900, 0.25, 1.0)
    setTimeout(() => {
      if (isPlaying && ctx.state !== 'closed') playBeep(ctx, 1300, 0.25, 1.0)
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
