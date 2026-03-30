import { useState, useEffect, useRef } from 'react'

export default function AddressInput({ value, onChange, onSelect, placeholder, style }) {
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Esperar a que Google Maps esté disponible
    const check = () => {
      if (window.google?.maps?.places) {
        setLoaded(true)
        return true
      }
      return false
    }
    if (check()) return

    // Si no está cargado, cargar el script
    if (!document.querySelector('script[src*="maps.googleapis.com/maps/api"]')) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.onload = () => check()
      document.head.appendChild(script)
    } else {
      const interval = setInterval(() => { if (check()) clearInterval(interval) }, 200)
      return () => clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'es' },
      fields: ['formatted_address', 'geometry', 'name'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
        onChange(place.formatted_address)
        if (onSelect) {
          onSelect({
            direccion: place.formatted_address,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
          })
        }
      }
    })

    autocompleteRef.current = autocomplete
  }, [loaded])

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'Buscar dirección...'}
      style={style}
    />
  )
}
