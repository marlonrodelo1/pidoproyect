import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { registerWebPush } from '../lib/webPush'

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
    // Buscar el establecimiento del usuario autenticado
    // Primero buscamos en establecimientos donde el email coincida
    const { data: user } = await supabase.auth.getUser()
    const email = user?.user?.email

    if (email) {
      const { data } = await supabase
        .from('establecimientos')
        .select('*')
        .eq('email', email)
        .single()
      setRestaurante(data)
      if (data) registerWebPush('restaurante', { establecimiento_id: data.id })
    }
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

  async function logout() { await supabase.auth.signOut() }

  return (
    <RestContext.Provider value={{ user, restaurante, loading, login, logout, updateRestaurante, refetch: () => fetchRestaurante(user?.id) }}>
      {children}
    </RestContext.Provider>
  )
}

export const useRest = () => useContext(RestContext)
