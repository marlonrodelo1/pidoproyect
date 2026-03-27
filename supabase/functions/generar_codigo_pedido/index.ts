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

    // Contar pedidos para generar codigo secuencial
    const { count } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact', head: true })

    const numero = (count || 0) + 1
    const codigo = `PD-${numero.toString().padStart(4, '0')}`

    // Verificar unicidad
    const { data: existe } = await supabase
      .from('pedidos')
      .select('id')
      .eq('codigo', codigo)
      .single()

    const codigoFinal = existe
      ? `PD-${numero.toString().padStart(4, '0')}-${Date.now().toString(36).slice(-3).toUpperCase()}`
      : codigo

    return new Response(
      JSON.stringify({ codigo: codigoFinal }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
