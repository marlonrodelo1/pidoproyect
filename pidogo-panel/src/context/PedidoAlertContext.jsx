import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useSocio } from './SocioContext'
import { startAlarm, stopAlarm } from '../lib/alarm'

const PedidoAlertContext = createContext({})

export function PedidoAlertProvider({ children, onNuevoPedido }) {
  const { socio } = useSocio()
  const [pedidosPendientes, setPedidosPendientes] = useState([])
  const [pedidosActivos, setPedidosActivos] = useState([])

  // Fetch pedidos asignados al socio
  const fetchPedidos = useCallback(async () => {
    if (!socio) return
    const { data } = await supabase
      .from('pedidos')
      .select('*, establecimientos(nombre, direccion, latitud, longitud, telefono)')
      .eq('socio_id', socio.id)
      .in('estado', ['nuevo', 'aceptado', 'preparando', 'listo', 'recogido', 'en_camino'])
      .order('created_at', { ascending: false })

    const all = data || []
    setPedidosPendientes(all.filter(p => p.rider_estado === 'pendiente'))
    setPedidosActivos(all.filter(p => p.rider_estado === 'aceptado' && ['preparando', 'listo', 'recogido', 'en_camino'].includes(p.estado)))

    // Sonar alarma si hay pendientes
    if (all.some(p => p.rider_estado === 'pendiente')) {
      startAlarm()
    }
  }, [socio?.id])

  // Realtime subscription global - suena en CUALQUIER pantalla
  useEffect(() => {
    if (!socio) return
    fetchPedidos()

    const channel = supabase.channel('pedidos-socio-global')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'pedidos',
        filter: `socio_id=eq.${socio.id}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          const p = payload.new
          if (p.rider_estado === 'pendiente') {
            setPedidosPendientes(prev => [p, ...prev])
            startAlarm()
            if (onNuevoPedido) onNuevoPedido(p)
          }
        } else if (payload.eventType === 'UPDATE') {
          const p = payload.new
          // Nuevo pedido asignado (restaurante aceptó y nos asignó)
          if (p.rider_estado === 'pendiente' && p.socio_id === socio.id) {
            setPedidosPendientes(prev => {
              const exists = prev.some(x => x.id === p.id)
              return exists ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]
            })
            startAlarm()
            if (onNuevoPedido) onNuevoPedido(p)
          } else if (p.rider_estado === 'aceptado') {
            // Socio aceptó - mover de pendientes a activos
            setPedidosPendientes(prev => prev.filter(x => x.id !== p.id))
            setPedidosActivos(prev => {
              const exists = prev.some(x => x.id === p.id)
              return exists ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]
            })
          } else if (['entregado', 'cancelado', 'fallido'].includes(p.estado)) {
            // Pedido terminado - quitar de ambas listas
            setPedidosPendientes(prev => prev.filter(x => x.id !== p.id))
            setPedidosActivos(prev => prev.filter(x => x.id !== p.id))
          } else {
            // Actualizar en activos
            setPedidosActivos(prev => prev.map(x => x.id === p.id ? { ...x, ...p } : x))
          }
        } else if (payload.eventType === 'DELETE') {
          setPedidosPendientes(prev => prev.filter(x => x.id !== payload.old.id))
          setPedidosActivos(prev => prev.filter(x => x.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [socio?.id, fetchPedidos, onNuevoPedido])

  // Parar alarma cuando no hay pendientes
  useEffect(() => {
    if (pedidosPendientes.length === 0) stopAlarm()
  }, [pedidosPendientes.length])

  return (
    <PedidoAlertContext.Provider value={{
      pedidosPendientes,
      pedidosActivos,
      setPedidosPendientes,
      setPedidosActivos,
      fetchPedidos,
    }}>
      {children}
    </PedidoAlertContext.Provider>
  )
}

export const usePedidoAlert = () => useContext(PedidoAlertContext)
