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
    const { data } = await supabase
      .from('socios')
      .select('*')
      .eq('user_id', userId)
      .single()
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

  async function registro(formData) {
    const { data: roleCheck } = await supabase.rpc('check_email_role', { check_email: formData.email })
    if (roleCheck?.exists) throw new Error(`Este email ya está registrado como ${roleCheck.role}. Usa otro email.`)

    const { data, error } = await supabase.auth.signUp({ email: formData.email, password: formData.password, options: { data: { nombre: formData.nombre } } })
    if (error) throw error

    // Generar slug
    const slug = formData.nombre_comercial.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

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
