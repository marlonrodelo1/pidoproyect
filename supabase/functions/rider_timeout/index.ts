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

      // Si han pasado más de 5 min buscando → cancelar entrega
      if (diffTotal > 300) {
        await supabase.from('pedidos').update({
          socio_id: null,
          rider_estado: 'cancelado',
          rider_asignado_at: null,
        }).eq('id', pedido.id)

        // Notificar al cliente
        if (pedido.usuario_id) {
          await supabase.from('notificaciones').insert({
            usuario_id: pedido.usuario_id,
            titulo: 'Sin repartidor disponible',
            descripcion: `No encontramos repartidor para tu pedido ${pedido.codigo}. Puedes recogerlo en el restaurante.`,
            leida: false,
          })
        }

        cancelados++
        continue
      }

      // Si han pasado más de 2 min con este rider → reasignar
      if (diffAsignado > 120) {
        const rechazados = pedido.riders_rechazados || []
        const riderActual = pedido.socio_id
        if (riderActual) rechazados.push(riderActual)

        // Buscar otro rider disponible
        const { data: relaciones } = await supabase
          .from('socio_establecimiento').select('socio_id')
          .eq('establecimiento_id', pedido.establecimiento_id).eq('estado', 'aceptado')

        let nuevoRider = null
        if (relaciones && relaciones.length > 0) {
          let socioIds = relaciones.map((r: any) => r.socio_id)
          socioIds = socioIds.filter((id: string) => !rechazados.includes(id))

          if (socioIds.length > 0) {
            const { data: sociosActivos } = await supabase
              .from('socios').select('id')
              .in('id', socioIds).eq('activo', true).eq('en_servicio', true).limit(1)
            if (sociosActivos && sociosActivos.length > 0) {
              nuevoRider = sociosActivos[0].id
            }
          }
        }

        if (nuevoRider) {
          // Reasignar a nuevo rider
          await supabase.from('pedidos').update({
            socio_id: nuevoRider,
            rider_estado: 'pendiente',
            rider_asignado_at: now.toISOString(),
            riders_rechazados: rechazados,
          }).eq('id', pedido.id)
          reasignados++
        } else {
          // No hay más riders → cancelar entrega
          await supabase.from('pedidos').update({
            socio_id: null,
            rider_estado: 'cancelado',
            rider_asignado_at: null,
            riders_rechazados: rechazados,
          }).eq('id', pedido.id)

          if (pedido.usuario_id) {
            await supabase.from('notificaciones').insert({
              usuario_id: pedido.usuario_id,
              titulo: 'Sin repartidor disponible',
              descripcion: `No encontramos repartidor para tu pedido ${pedido.codigo}. Puedes recogerlo en el restaurante.`,
              leida: false,
            })
          }
          cancelados++
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

      if (diffTotal > 300) {
        await supabase.from('pedidos').update({
          rider_estado: 'cancelado',
        }).eq('id', pedido.id)
        cancelados++
        continue
      }

      const rechazados = pedido.riders_rechazados || []
      const { data: relaciones } = await supabase
        .from('socio_establecimiento').select('socio_id')
        .eq('establecimiento_id', pedido.establecimiento_id).eq('estado', 'aceptado')

      let nuevoRider = null
      if (relaciones && relaciones.length > 0) {
        let socioIds = relaciones.map((r: any) => r.socio_id)
        socioIds = socioIds.filter((id: string) => !rechazados.includes(id))
        if (socioIds.length > 0) {
          const { data: sociosActivos } = await supabase
            .from('socios').select('id')
            .in('id', socioIds).eq('activo', true).eq('en_servicio', true).limit(1)
          if (sociosActivos && sociosActivos.length > 0) nuevoRider = sociosActivos[0].id
        }
      }

      if (nuevoRider) {
        await supabase.from('pedidos').update({
          socio_id: nuevoRider,
          rider_estado: 'pendiente',
          rider_asignado_at: now.toISOString(),
        }).eq('id', pedido.id)
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
