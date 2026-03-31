import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const now = new Date()

    // Timeout config
    const RIDER_ACCEPT_TIMEOUT = 120   // 2 min para que un rider acepte
    const TOTAL_SEARCH_TIMEOUT = 480   // 8 min total buscando riders (antes 5)

    // Buscar pedidos con rider pendiente que han pasado los 2 min
    const { data: pedidosPendientes } = await supabase
      .from('pedidos')
      .select('*')
      .eq('rider_estado', 'pendiente')
      .not('rider_asignado_at', 'is', null)

    let reasignados = 0
    let cancelados = 0

    for (const pedido of pedidosPendientes || []) {
      const asignadoAt = new Date(pedido.rider_asignado_at).getTime()
      const buscandoDesde = new Date(pedido.rider_buscando_desde).getTime()
      const diffAsignado = (now.getTime() - asignadoAt) / 1000
      const diffTotal = (now.getTime() - buscandoDesde) / 1000

      // Si han pasado más de 8 min buscando → cambiar a sin_rider (no cancelar pedido)
      if (diffTotal > TOTAL_SEARCH_TIMEOUT) {
        await supabase.from('pedidos').update({
          socio_id: null,
          rider_estado: 'sin_rider',
          rider_asignado_at: null,
        }).eq('id', pedido.id)

        // Notificar al cliente
        if (pedido.usuario_id) {
          await supabase.from('notificaciones').insert({
            usuario_id: pedido.usuario_id,
            titulo: 'Sin repartidor disponible',
            descripcion: `No encontramos repartidor para tu pedido ${pedido.codigo}. El restaurante te informara sobre la recogida.`,
            leida: false,
          })
          // Push al cliente
          await notificarPush(supabase, 'cliente', pedido.usuario_id,
            'Sin repartidor disponible',
            `No encontramos repartidor para ${pedido.codigo}. El restaurante te informara.`
          )
        }

        // Notificar al restaurante
        await notificarPush(supabase, 'restaurante', pedido.establecimiento_id,
          'Sin repartidor',
          `Pedido ${pedido.codigo}: no se encontro repartidor. Puedes reintentar o cambiar a recogida.`
        )

        cancelados++
        continue
      }

      // Si han pasado más de 2 min con este rider → reasignar
      if (diffAsignado > RIDER_ACCEPT_TIMEOUT) {
        const rechazados = pedido.riders_rechazados || []
        const riderActual = pedido.socio_id
        if (riderActual) rechazados.push(riderActual)

        // Buscar otro rider disponible
        const nuevoRider = await buscarRiderDisponible(supabase, pedido.establecimiento_id, rechazados)

        if (nuevoRider) {
          // Reasignar a nuevo rider
          await supabase.from('pedidos').update({
            socio_id: nuevoRider,
            rider_estado: 'pendiente',
            rider_asignado_at: now.toISOString(),
            riders_rechazados: rechazados,
          }).eq('id', pedido.id)

          // Push al nuevo rider
          await notificarPush(supabase, 'socio', nuevoRider,
            'Nuevo pedido',
            `Pedido ${pedido.codigo} - ${pedido.total?.toFixed(2)} € · Tienes 2 min para aceptar`
          )

          // Notificar al cliente que se busca otro rider
          if (pedido.usuario_id) {
            await notificarPush(supabase, 'cliente', pedido.usuario_id,
              'Buscando repartidor',
              `Estamos asignando otro repartidor para tu pedido ${pedido.codigo}`
            )
          }

          reasignados++
        } else {
          // No hay más riders → poner en buscando (no cancelar aún, esperar los 8 min)
          await supabase.from('pedidos').update({
            socio_id: null,
            rider_estado: 'buscando',
            rider_asignado_at: null,
            riders_rechazados: rechazados,
          }).eq('id', pedido.id)

          // Notificar al cliente
          if (pedido.usuario_id) {
            await notificarPush(supabase, 'cliente', pedido.usuario_id,
              'Buscando repartidor',
              `Seguimos buscando un repartidor disponible para tu pedido ${pedido.codigo}`
            )
          }
        }
      }
    }

    // También buscar pedidos con rider_estado = 'buscando' (rider rechazó, buscar otro)
    const { data: pedidosBuscando } = await supabase
      .from('pedidos')
      .select('*')
      .eq('rider_estado', 'buscando')

    for (const pedido of pedidosBuscando || []) {
      const buscandoDesde = new Date(pedido.rider_buscando_desde).getTime()
      const diffTotal = (now.getTime() - buscandoDesde) / 1000

      if (diffTotal > TOTAL_SEARCH_TIMEOUT) {
        await supabase.from('pedidos').update({
          socio_id: null,
          rider_estado: 'sin_rider',
        }).eq('id', pedido.id)

        if (pedido.usuario_id) {
          await supabase.from('notificaciones').insert({
            usuario_id: pedido.usuario_id,
            titulo: 'Sin repartidor disponible',
            descripcion: `No encontramos repartidor para tu pedido ${pedido.codigo}. El restaurante te informara sobre la recogida.`,
            leida: false,
          })
          await notificarPush(supabase, 'cliente', pedido.usuario_id,
            'Sin repartidor disponible',
            `No encontramos repartidor para ${pedido.codigo}. El restaurante te informara.`
          )
        }

        // Notificar al restaurante
        await notificarPush(supabase, 'restaurante', pedido.establecimiento_id,
          'Sin repartidor',
          `Pedido ${pedido.codigo}: no se encontro repartidor. Puedes reintentar o cambiar a recogida.`
        )

        cancelados++
        continue
      }

      // Intentar reasignar
      const rechazados = pedido.riders_rechazados || []
      const nuevoRider = await buscarRiderDisponible(supabase, pedido.establecimiento_id, rechazados)

      if (nuevoRider) {
        await supabase.from('pedidos').update({
          socio_id: nuevoRider,
          rider_estado: 'pendiente',
          rider_asignado_at: now.toISOString(),
        }).eq('id', pedido.id)

        await notificarPush(supabase, 'socio', nuevoRider,
          'Nuevo pedido',
          `Pedido ${pedido.codigo} - ${pedido.total?.toFixed(2)} € · Tienes 2 min para aceptar`
        )

        reasignados++
      }
    }

    return new Response(JSON.stringify({ reasignados, cancelados }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Buscar rider disponible excluyendo los rechazados
async function buscarRiderDisponible(supabase: any, establecimientoId: string, rechazados: string[]) {
  const { data: relaciones } = await supabase
    .from('socio_establecimiento').select('socio_id')
    .eq('establecimiento_id', establecimientoId).eq('estado', 'aceptado')

  if (!relaciones || relaciones.length === 0) return null

  let socioIds = relaciones.map((r: any) => r.socio_id)
  socioIds = socioIds.filter((id: string) => !rechazados.includes(id))
  if (socioIds.length === 0) return null

  // Buscar el más cercano al restaurante
  const { data: est } = await supabase
    .from('establecimientos').select('latitud, longitud')
    .eq('id', establecimientoId).single()

  const { data: sociosActivos } = await supabase
    .from('socios').select('id, latitud_actual, longitud_actual')
    .in('id', socioIds).eq('activo', true).eq('en_servicio', true)

  if (!sociosActivos || sociosActivos.length === 0) return null

  // Ordenar por distancia
  if (est?.latitud && est?.longitud) {
    const conDist = sociosActivos
      .filter((s: any) => s.latitud_actual && s.longitud_actual)
      .map((s: any) => {
        const dLat = (s.latitud_actual - est.latitud) * 111.32
        const dLng = (s.longitud_actual - est.longitud) * 111.32 * Math.cos(est.latitud * Math.PI / 180)
        return { ...s, dist: Math.sqrt(dLat * dLat + dLng * dLng) }
      })
      .sort((a: any, b: any) => a.dist - b.dist)
    return conDist.length > 0 ? conDist[0].id : sociosActivos[0].id
  }

  return sociosActivos[0].id
}

// Enviar push notification usando la Edge Function enviar_push
async function notificarPush(supabase: any, targetType: string, targetId: string, title: string, body: string) {
  try {
    await supabase.functions.invoke('enviar_push', {
      body: { targetType, targetId, title, body },
    })
  } catch {
    // Silenciar errores de push - no son críticos
  }
}
