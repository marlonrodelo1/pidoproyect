import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { registerWebPush } from '../lib/webPush'
import { registerPushNotifications } from '../lib/pushNotifications'

const RestContext = createContext({})

export function RestProvider({ children }) {
  const [user, setUser] = useState(null)
  const [restaurante, setRestaurante] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchRestaurante(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchRestaurante(session.user.id)
      else { setRestaurante(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRestaurante(userId) {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const email = userData?.user?.email
      if (email) {
        const { data } = await supabase.from('establecimientos').select('*').eq('email', email).single()
        setRestaurante(data)
        if (data) {
          registerWebPush('restaurante', { establecimiento_id: data.id })
          registerPushNotifications('restaurante', { establecimiento_id: data.id })
        }
      }
    } catch {}
    setLoading(false)
  }

  async function updateRestaurante(updates) {
    if (!restaurante) return
    const { data, error } = await supabase
      .from('establecimientos')
      .update(updates)
      .eq('id', restaurante.id)
      .select()
      .single()
    if (!error && data) setRestaurante(data)
    return { data, error }
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function registro(formData) {
    // Verificar email no existe en otros roles
    const { data: roleCheck } = await supabase.rpc('check_email_role', { check_email: formData.email })
    if (roleCheck?.exists) throw new Error(`Este email ya está registrado como ${roleCheck.role}. Usa otro email.`)

    // Crear auth user
    const { data, error } = await supabase.auth.signUp({ email: formData.email, password: formData.password, options: { data: { nombre: formData.nombre } } })
    if (error) throw error

    // Crear establecimiento
    const { error: estError } = await supabase.from('establecimientos').insert({
      nombre: formData.nombre,
      tipo: formData.tipo || 'restaurante',
      categoria_padre: formData.categoria_padre || 'comida',
      email: formData.email,
      telefono: formData.telefono || null,
      direccion: formData.direccion || null,
      descripcion: formData.descripcion || null,
      activo: true,
      rating: 0,
      total_resenas: 0,
      latitud: 28.4148,
      longitud: -16.5477,
      radio_cobertura_km: 10,
    })
    if (estError) throw new Error('Error al crear el establecimiento')
    return data
  }

  async function logout() { await supabase.auth.signOut() }

  return (
    <RestContext.Provider value={{ user, restaurante, loading, login, registro, logout, updateRestaurante, refetch: () => fetchRestaurante(user?.id) }}>
      {children}
    </RestContext.Provider>
  )
}

export const useRest = () => useContext(RestContext)
