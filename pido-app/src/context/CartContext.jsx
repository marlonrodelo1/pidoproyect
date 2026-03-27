import { createContext, useContext, useState } from 'react'

const CartContext = createContext({})

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState([])
  const [propina, setPropina] = useState(0)
  const [metodoPago, setMetodoPago] = useState('tarjeta')
  const [modoEntrega, setModoEntrega] = useState('delivery') // 'delivery' o 'recogida'

  function addItem(item) {
    if (carrito.length > 0 && carrito[0].establecimiento_id !== item.establecimiento_id) {
      setCarrito([item])
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
  }

  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0)
  const subtotal = carrito.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0)
  const envio = modoEntrega === 'recogida' ? 0 : (carrito.length > 0 ? (carrito[0].coste_envio || 3.50) : 0)
  const total = subtotal + envio + propina

  return (
    <CartContext.Provider value={{
      carrito, addItem, removeItem, clearCart,
      propina, setPropina, metodoPago, setMetodoPago,
      modoEntrega, setModoEntrega,
      totalItems, subtotal, envio, total
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
