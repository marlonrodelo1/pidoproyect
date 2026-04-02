import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Calcula distancia en km entre dos puntos usando fórmula de Haversine
function calcularDistanciaKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const {
      canal,
      establecimiento_id,
      socio_id,
      lat_cliente,
      lng_cliente,
    } = await req.json()

    if (!establecimiento_id) throw new Error('establecimiento_id es requerido')
    if (lat_cliente == null || lng_cliente == null) throw new Error('Coordenadas del cliente son requeridas')
    if (!canal) throw new Error('canal es requerido (pido o pidogo)')

    // Obtener coordenadas del establecimiento
    const { data: est, error: estError } = await supabase
      .from('establecimientos')
      .select('latitud, longitud, radio_cobertura_km, nombre')
      .eq('id', establecimiento_id)
      .single()

    if (estError || !est) throw new Error('Establecimiento no encontrado')

    const distancia = calcularDistanciaKm(
      est.latitud, est.longitud,
      lat_cliente, lng_cliente
    )

    // Validar que el cliente está dentro del radio de cobertura
    if (est.radio_cobertura_km && distancia > est.radio_cobertura_km) {
      return new Response(
        JSON.stringify({
          error: `Tu dirección está fuera del radio de entrega de ${est.nombre} (${est.radio_cobertura_km} km). Estás a ${Math.round(distancia * 10) / 10} km.`,
          fuera_de_radio: true,
          distancia_km: Math.round(distancia * 100) / 100,
          radio_km: est.radio_cobertura_km,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let envio: number
    let detalle: Record<string, unknown>

    if (canal === 'pidogo') {
      // Canal PIDOGO: tarifas del socio
      if (!socio_id) throw new Error('socio_id es requerido para canal pidogo')

      const { data: socio, error: socioError } = await supabase
        .from('socios')
        .select('tarifa_base, radio_tarifa_base_km, precio_km_adicional')
        .eq('id', socio_id)
        .single()

      if (socioError || !socio) throw new Error('Socio no encontrado')

      if (distancia <= socio.radio_tarifa_base_km) {
        envio = socio.tarifa_base
      } else {
        const kmExtra = distancia - socio.radio_tarifa_base_km
        envio = socio.tarifa_base + (kmExtra * socio.precio_km_adicional)
      }

      envio = Math.round(envio * 100) / 100

      detalle = {
        tarifa_base: socio.tarifa_base,
        radio_base_km: socio.radio_tarifa_base_km,
        precio_km_adicional: socio.precio_km_adicional,
      }
    } else {
      // Canal PIDO: tarifas de la plataforma (desde configuracion_plataforma)
      const { data: configRows } = await supabase
        .from('configuracion_plataforma')
        .select('clave, valor')
        .in('clave', ['envio_tarifa_base', 'envio_radio_base_km', 'envio_precio_km_adicional', 'envio_tarifa_maxima'])

      const config: Record<string, number> = {}
      for (const row of (configRows || [])) {
        config[row.clave] = parseFloat(row.valor)
      }

      const tarifa_base = config.envio_tarifa_base ?? 2.50
      const radio_base_km = config.envio_radio_base_km ?? 2
      const precio_km_adicional = config.envio_precio_km_adicional ?? 0.50
      const tarifa_maxima = config.envio_tarifa_maxima ?? 15.00

      if (distancia <= radio_base_km) {
        envio = tarifa_base
      } else {
        const kmExtra = distancia - radio_base_km
        envio = tarifa_base + (kmExtra * precio_km_adicional)
      }

      if (envio > tarifa_maxima) {
        envio = tarifa_maxima
      }

      envio = Math.round(envio * 100) / 100

      detalle = {
        tarifa_base,
        radio_base_km,
        precio_km_adicional,
        tarifa_maxima,
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        envio,
        distancia_km: Math.round(distancia * 100) / 100,
        canal,
        detalle,
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
