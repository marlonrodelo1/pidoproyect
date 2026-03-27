import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchPerfil(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchPerfil(session.user.id)
      else { setPerfil(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchPerfil(userId) {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single()
    setPerfil(data)
    setLoading(false)
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function registro(email, password, nombre, telefono) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    // Crear perfil en tabla usuarios
    const { error: perfilError } = await supabase.from('usuarios').insert({
      id: data.user.id,
      nombre,
      email,
      telefono,
    })
    if (perfilError) throw perfilError
    return data
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, login, registro, logout, fetchPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
