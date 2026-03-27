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
    if (error) throw new Error(traducirError(error.message))
    return data
  }

  async function registro(email, password, nombre, telefono) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(traducirError(error.message))

    const { error: perfilError } = await supabase.from('usuarios').insert({
      id: data.user.id,
      nombre,
      email,
      telefono,
    })
    if (perfilError) throw new Error('Error al crear el perfil. Intenta de nuevo.')
    return data
  }

  async function updatePerfil(campos) {
    if (!perfil?.id) throw new Error('No hay sesión activa')
    const { data, error } = await supabase
      .from('usuarios')
      .update(campos)
      .eq('id', perfil.id)
      .select()
      .single()
    if (error) throw new Error('Error al actualizar el perfil')
    setPerfil(data)
    return data
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw new Error(traducirError(error.message))
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, login, registro, logout, fetchPerfil, updatePerfil, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

function traducirError(msg) {
  const map = {
    'Invalid login credentials': 'Email o contraseña incorrectos',
    'Email not confirmed': 'Confirma tu email antes de iniciar sesión',
    'User already registered': 'Este email ya está registrado',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Unable to validate email address: invalid format': 'Formato de email inválido',
    'Signup requires a valid password': 'Introduce una contraseña válida',
    'Email rate limit exceeded': 'Demasiados intentos. Espera unos minutos.',
    'For security purposes, you can only request this once every 60 seconds': 'Espera 60 segundos antes de intentar de nuevo',
  }
  return map[msg] || msg
}

export const useAuth = () => useContext(AuthContext)
