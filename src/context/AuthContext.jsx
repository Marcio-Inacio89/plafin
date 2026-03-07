import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../config/supabase'

const AuthContext = createContext(null)

const FAKE_DOMAIN = '@plafin.local'

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const getUsername = useCallback(() => {
    if (!user) return ''
    return user.user_metadata?.username || user.email?.replace(FAKE_DOMAIN, '') || ''
  }, [user])

  const signUp = useCallback(async (username, password) => {
    const email = `${username.toLowerCase().trim()}${FAKE_DOMAIN}`
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.toLowerCase().trim() },
        emailRedirectTo: undefined,
      }
    })

    if (error) {
      if (error.message?.includes('already registered')) {
        throw new Error('USERNAME_TAKEN')
      }
      throw error
    }

    if (data?.user?.identities?.length === 0) {
      throw new Error('USERNAME_TAKEN')
    }

    return data
  }, [])

  const signIn = useCallback(async (username, password) => {
    const email = `${username.toLowerCase().trim()}${FAKE_DOMAIN}`
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = {
    user,
    loading,
    getUsername,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
