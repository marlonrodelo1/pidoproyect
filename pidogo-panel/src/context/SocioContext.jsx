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
    // Verificar rol en tabla usuarios
    const { data: perfil } = await supabase.from('usuarios').select('id, rol, created_at').eq('id', userId).single()
    if (perfil) {
      // Bloquear solo restaurantes — tienen su propio panel
      if (perfil.rol === 'restaurante') {
        await supabase.auth.signOut()
        setUser(null)
        setSocio(null)
        setLoading(false)
        return
      }
      // 'socio' y 'cliente' pueden entrar — un cliente puede registrarse como repartidor
    }

    let { data } = await supabase
      .from('socios')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!data) {
      // No tiene perfil de socio — necesita completar registro de repartidor
      // (aplica tanto para clientes de pido-app como nuevos usuarios Google OAuth)
      setSocio(null)
      setLoading(false)
      return
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

  // Registro como socio para usuarios que ya tienen cuenta (clientes de pido-app o Google OAuth)
  async function registroComoSocio(formData) {
    if (!user) throw new Error('Debes iniciar sesión primero')
    const slug = await generarSlugUnico(formData.nombre_comercial)
    const { data: newSocio, error } = await supabase.from('socios').insert({
      user_id: user.id,
      nombre: formData.nombre,
      nombre_comercial: formData.nombre_comercial,
      slug,
      email: user.email || '',
      telefono: formData.telefono || null,
      modo_entrega: 'ambos',
      radio_km: 10,
      tarifa_base: 3,
      radio_tarifa_base_km: 3,
      precio_km_adicional: 0.50,
      activo: false,
      en_servicio: false,
    }).select().single()
    if (error) throw new Error('Error al crear el perfil de socio')
    setSocio(newSocio)
    registerWebPush('socio', { socio_id: newSocio.id })
    registerPushNotifications('socio', { socio_id: newSocio.id })
    return newSocio
  }

  async function registro(formData) {
    const { data: roleCheck } = await supabase.rpc('check_email_role', { check_email: formData.email })
    if (roleCheck?.exists) {
      if (roleCheck.role === 'cliente') {
        throw new Error('Ya tienes cuenta en Pidoo. Usa "Iniciar sesión" con tu email y contraseña para registrarte como repartidor.')
      }
      throw new Error(`Este email ya está registrado como ${roleCheck.role}. Usa otro email.`)
    }

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
    <SocioContext.Provider value={{ user, socio, loading, login, registro, registroComoSocio, logout, updateSocio, fetchSocio: () => fetchSocio(user?.id) }}>
      {children}
    </SocioContext.Provider>
  )
}

export const useSocio = () => useContext(SocioContext)
