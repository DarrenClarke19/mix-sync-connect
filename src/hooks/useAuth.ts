import { useState, useEffect } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'

export interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState(prev => ({ ...prev, error, loading: false }))
        return
      }

      if (session?.user) {
        fetchProfile(session.user.id).then(profile => {
          setState({
            user: session.user,
            profile,
            session,
            loading: false,
            error: null,
          })
        })
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({
            user: session.user,
            profile,
            session,
            loading: false,
            error: null,
          })
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
        }
      }
    })

    if (error) {
      setState(prev => ({ ...prev, error, loading: false }))
      return { error }
    }

    return { data }
  }

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setState(prev => ({ ...prev, error, loading: false }))
      return { error }
    }

    return { data }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      setState(prev => ({ ...prev, error, loading: false }))
    }
    
    return { error }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) return { error: new Error('Not authenticated') }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id)
      .select()
      .single()

    if (error) {
      return { error }
    }

    setState(prev => ({ ...prev, profile: data }))
    return { data }
  }

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }
}