import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { registerWebPush } from '../lib/webPush'
import { registerPushNotifications } from '../lib/pushNotifications'

const SocioContext = createContext({})

export function SocioProvider({ children }) {
  const [user, setUser] = useState(null)
  const [socio, setSocio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchSocio(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchSocio(session.user.id)
      else { setSocio(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchSocio(userId) {
    // Verificar/asignar rol 'socio' en tabla usuarios (Google OAuth crea con 'cliente' por defecto)
    const { data: perfil } = await supabase.from('usuarios').select('id, rol, created_at').eq('id', userId).single()
    if (perfil) {
      if (perfil.rol !== 'socio') {
        // Si fue creado hace menos de 2 min (nuevo usuario Google OAuth), actualizar rol
        const createdAt = new Date(perfil.created_at)
        const now = new Date()
        if ((now - createdAt) < 120000) {
          await supabase.from('usuarios').update({ rol: 'socio' }).eq('id', userId)
        } else {
          // Usuario existente con otro rol — no puede acceder como socio
          await supabase.auth.signOut()
          setUser(null)
          setSocio(null)
          setLoading(false)
          return
        }
      }
    }

    let { data } = await supabase
      .from('socios')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Si no existe perfil de socio (ej: Google OAuth primer login), crearlo automáticamente
    if (!data) {
      const { data: { user } } = await supabase.auth.getUser()
      const nombre = user?.user_metadata?.full_name || user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Socio'
      const nombreComercial = `${nombre} Delivery`
      const slug = await generarSlugUnico(nombreComercial)

      const { data: newSocio, error: createErr } = await supabase.from('socios').insert({
        user_id: userId,
        nombre,
        nombre_comercial: nombreComercial,
        slug,
        email: user?.email || '',
        modo_entrega: 'ambos',
        radio_km: 10,
        tarifa_base: 3,
        radio_tarifa_base_km: 3,
        precio_km_adicional: 0.50,
        activo: false,
        en_servicio: false,
      }).select().single()

      if (createErr) { console.error('Error creando perfil socio:', createErr); setLoading(false); return }
      data = newSocio
    }

    setSocio(data)
    setLoading(false)
    if (data) {
      registerWebPush('socio', { socio_id: data.id })
      registerPushNotifications('socio', { socio_id: data.id })
    }
  }

  async function updateSocio(updates) {
    if (!socio) return
    const { data, error } = await supabase
      .from('socios')
      .update(updates)
      .eq('id', socio.id)
      .select()
      .single()
    if (!error && data) setSocio(data)
    return { data, error }
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  // Genera un slug único a partir del nombre comercial, añadiendo sufijo numérico si ya existe
  async function generarSlugUnico(nombreComercial) {
    const base = nombreComercial.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    if (!base) return `socio-${Date.now()}`

    // Verificar si el slug base ya existe
    const { data: existente } = await supabase.from('socios').select('slug').eq('slug', base).maybeSingle()
    if (!existente) return base

    // Si existe, buscar todos los que empiecen con el slug base y añadir sufijo
    const { data: similares } = await supabase.from('socios').select('slug').like('slug', `${base}%`)
    const sufijos = (similares || [])
      .map(s => { const match = s.slug.match(new RegExp(`^${base}-(\\d+)$`)); return match ? parseInt(match[1]) : 0 })
      .filter(n => n > 0)
    const siguiente = sufijos.length > 0 ? Math.max(...sufijos) + 1 : 2
    return `${base}-${siguiente}`
  }

  async function registro(formData) {
    const { data: roleCheck } = await supabase.rpc('check_email_role', { check_email: formData.email })
    if (roleCheck?.exists) throw new Error(`Este email ya está registrado como ${roleCheck.role}. Usa otro email.`)

    const { data, error } = await supabase.auth.signUp({ email: formData.email, password: formData.password, options: { data: { nombre: formData.nombre, rol: 'socio' } } })
    if (error) throw error

    // Generar slug único (evita colisiones)
    const slug = await generarSlugUnico(formData.nombre_comercial)

    const { error: socioError } = await supabase.from('socios').insert({
      user_id: data.user?.id,
      nombre: formData.nombre,
      nombre_comercial: formData.nombre_comercial,
      slug,
      email: formData.email,
      telefono: formData.telefono || null,
      modo_entrega: 'ambos',
      radio_km: 10,
      tarifa_base: 3,
      radio_tarifa_base_km: 3,
      precio_km_adicional: 0.50,
      activo: false, // Requiere aprobación del admin
      en_servicio: false,
    })
    if (socioError) throw new Error('Error al crear el perfil de socio')
    return data
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <SocioContext.Provider value={{ user, socio, loading, login, registro, logout, updateSocio, fetchSocio: () => fetchSocio(user?.id) }}>
      {children}
    </SocioContext.Provider>
  )
}

export const useSocio = () => useContext(SocioContext)
