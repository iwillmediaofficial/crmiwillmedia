import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database.types'
import { AuthState, UserRole } from './types'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      if (data && !data.active) {
        console.warn('User account is deactivated. Signing out.')
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        alert('Your account has been deactivated. Please contact an administrator.')
        return null
      }

      return data as Profile
    } catch (err) {
      console.error('Unexpected error loading profile:', err)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      const p = await fetchProfile(user.id)
      setProfile(p)
    }
  }

  useEffect(() => {
    // Check initial active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      } else {
        setUser(null)
        setProfile(null)
      }
      setIsLoading(false)
    })

    // Listen to auth events (LOGIN, LOGOUT, TOKEN_REFRESHED)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      } else {
        setUser(null)
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const role = (profile?.role as UserRole) || 'staff'
  const isAdmin = role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAdmin,
        role,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
