import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'

export async function getCurrentPosition() {
  if (Capacitor.isNativePlatform()) {
    const perm = await Geolocation.requestPermissions()
    if (perm.location !== 'granted') throw new Error('Permiso de ubicación denegado')
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true })
    return { lat: pos.coords.latitude, lng: pos.coords.longitude }
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocalización no soportada')); return }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err), { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

export async function watchPosition(callback) {
  if (Capacitor.isNativePlatform()) {
    return await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos) => {
      if (pos) callback({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
  }
  return navigator.geolocation.watchPosition(
    pos => callback({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => {}, { enableHighAccuracy: true }
  )
}

export async function clearWatch(watchId) {
  if (Capacitor.isNativePlatform()) await Geolocation.clearWatch({ id: watchId })
  else navigator.geolocation.clearWatch(watchId)
}
