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

    // Obtener el pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedido_id)
      .single()

    if (pedidoError || !pedido) throw new Error('Pedido no encontrado')
    if (pedido.estado !== 'entregado') throw new Error('El pedido no esta entregado')

    // Determinar tipo: si tiene coste_envio > 0 es reparto, sino recogida
    const esReparto = (pedido.coste_envio || 0) > 0
    const tipo = esReparto ? 'reparto' : 'recogida'
    const subtotal = pedido.subtotal || 0

    const comision_plataforma = subtotal * 0.10
    const comision_socio = esReparto ? subtotal * 0.10 : subtotal * 0.05
    const envio_socio = esReparto ? (pedido.coste_envio || 0) : 0
    const propina_socio = esReparto ? (pedido.propina || 0) : 0

    // Insertar comision
    const { data: comision, error: comError } = await supabase
      .from('comisiones')
      .insert({
        pedido_id: pedido.id,
        socio_id: pedido.socio_id,
        establecimiento_id: pedido.establecimiento_id,
        total_pedido: subtotal,
        comision_plataforma,
        comision_socio,
        envio_socio,
        propina_socio,
        tipo,
      })
      .select()
      .single()

    if (comError) throw comError

    // Registrar movimiento de cuenta
    if (pedido.metodo_pago === 'tarjeta') {
      // Entrada del pago con tarjeta
      await supabase.from('movimientos_cuenta').insert({
        tipo: 'entrada_tarjeta',
        pedido_id: pedido.id,
        establecimiento_id: pedido.establecimiento_id,
        socio_id: pedido.socio_id,
        monto: pedido.total,
        descripcion: `Pago tarjeta pedido ${pedido.codigo}`,
        referencia: pedido.codigo,
      })
    }

    return new Response(
      JSON.stringify({ success: true, comision }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
