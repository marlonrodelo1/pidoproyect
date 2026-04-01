import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { pedido_id } = await req.json()
    if (!pedido_id) throw new Error('pedido_id es requerido')

    // Obtener el pedido con datos del establecimiento
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*, establecimientos(latitud, longitud)')
      .eq('id', pedido_id)
      .single()

    if (pedidoError || !pedido) throw new Error('Pedido no encontrado')
    if (pedido.canal !== 'pido') throw new Error('Solo pedidos del canal PIDO se asignan automaticamente')
    if (pedido.socio_id) throw new Error('El pedido ya tiene socio asignado')

    const estLat = pedido.establecimientos?.latitud
    const estLng = pedido.establecimientos?.longitud
    if (!estLat || !estLng) throw new Error('El establecimiento no tiene coordenadas')

    // Buscar socios activos y en servicio con relacion aceptada con este establecimiento
    const { data: relaciones } = await supabase
      .from('socio_establecimiento')
      .select('socio_id')
      .eq('establecimiento_id', pedido.establecimiento_id)
      .eq('estado', 'aceptado')

    if (!relaciones || relaciones.length === 0) throw new Error('No hay socios vinculados al establecimiento')

    const socioIds = relaciones.map(r => r.socio_id)

    // Obtener socios en servicio con su radio configurado
    const { data: socios } = await supabase
      .from('socios')
      .select('id, latitud_actual, longitud_actual, radio_km')
      .in('id', socioIds)
      .eq('activo', true)
      .eq('en_servicio', true)
      .not('latitud_actual', 'is', null)
      .not('longitud_actual', 'is', null)

    if (!socios || socios.length === 0) throw new Error('No hay socios disponibles en servicio')

    // Calcular distancia Haversine a cada socio
    const conDistancia = socios.map(s => {
      const R = 6371
      const dLat = (s.latitud_actual! - estLat) * Math.PI / 180
      const dLng = (s.longitud_actual! - estLng) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(estLat * Math.PI / 180) * Math.cos(s.latitud_actual! * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
      const distancia = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return { ...s, distancia }
    }).sort((a, b) => a.distancia - b.distancia)

    // Filtrar por radio_km del socio — solo los que tienen el pedido dentro de su zona
    const dentroDeRadio = conDistancia.filter(s => !s.radio_km || s.distancia <= s.radio_km)

    // Si hay candidatos dentro del radio, usar el más cercano. Si no, fallback al más cercano de todos
    const socioAsignado = dentroDeRadio.length > 0 ? dentroDeRadio[0] : conDistancia[0]

    // Asignar socio al pedido
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({ socio_id: socioAsignado.id })
      .eq('id', pedido_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        socio_id: socioAsignado.id,
        distancia_km: socioAsignado.distancia.toFixed(2),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
