import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const CartContext = createContext({})

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState([])
  const [propina, setPropina] = useState(0)
  const [metodoPago, setMetodoPago] = useState('tarjeta')
  const [modoEntrega, setModoEntrega] = useState('delivery') // 'delivery' o 'recogida'
  const [envio, setEnvio] = useState(0)
  const [distanciaKm, setDistanciaKm] = useState(null)
  const [envioLoading, setEnvioLoading] = useState(false)

  function addItem(item) {
    if (carrito.length > 0 && carrito[0].establecimiento_id !== item.establecimiento_id) {
      setCarrito([item])
      setEnvio(0)
      setDistanciaKm(null)
      return
    }
    setCarrito(prev => [...prev, item])
  }

  function removeItem(index) {
    setCarrito(prev => prev.filter((_, i) => i !== index))
  }

  function clearCart() {
    setCarrito([])
    setPropina(0)
    setModoEntrega('delivery')
    setEnvio(0)
    setDistanciaKm(null)
  }

  const calcularEnvio = useCallback(async (latCliente, lngCliente, canal = 'pido', socioId = null) => {
    if (carrito.length === 0 || modoEntrega === 'recogida') {
      setEnvio(0)
      return
    }
    if (!latCliente || !lngCliente) return

    setEnvioLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('calcular_envio', {
        body: {
          canal,
          establecimiento_id: carrito[0].establecimiento_id,
          socio_id: socioId,
          lat_cliente: latCliente,
          lng_cliente: lngCliente,
        },
      })
      if (error) throw error
      if (data?.success) {
        setEnvio(data.envio)
        setDistanciaKm(data.distancia_km)
      }
    } catch {
      // Fallback: tarifa base por defecto si falla el cálculo
      setEnvio(2.50)
    } finally {
      setEnvioLoading(false)
    }
  }, [carrito, modoEntrega])

  // Resetear envío cuando cambia a recogida
  useEffect(() => {
    if (modoEntrega === 'recogida') {
      setEnvio(0)
    }
  }, [modoEntrega])

  const envioFinal = modoEntrega === 'recogida' ? 0 : envio
  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0)
  const subtotal = carrito.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0)
  const total = subtotal + envioFinal + propina

  return (
    <CartContext.Provider value={{
      carrito, addItem, removeItem, clearCart,
      propina, setPropina, metodoPago, setMetodoPago,
      modoEntrega, setModoEntrega,
      totalItems, subtotal, envio: envioFinal, total,
      calcularEnvio, envioLoading, distanciaKm,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
