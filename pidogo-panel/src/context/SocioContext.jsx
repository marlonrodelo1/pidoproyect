import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { registerWebPush } from '../lib/webPush'

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
    if (data) registerWebPush('socio', { socio_id: data.id })
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

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <SocioContext.Provider value={{ user, socio, loading, login, logout, updateSocio, fetchSocio: () => fetchSocio(user?.id) }}>
      {children}
    </SocioContext.Provider>
  )
}

export const useSocio = () => useContext(SocioContext)
