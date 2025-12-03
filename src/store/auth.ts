import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { signIn, signOut, getCurrentSession } from '@/services/auth'
import { getCurrentUserProfile, type DbUser } from '@/services/users'
import { supabase } from '@/config/supabase'

type AuthState = {
  user: User | null
  profile: DbUser | null
  loading: boolean
  initFromSession: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  initFromSession: async () => {
    try {
      set({ loading: true })
      const session = await getCurrentSession()
      const user = session?.user ?? null
      const profile = user ? await getCurrentUserProfile() : null
      set({ user, profile, loading: false })
      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const u = session?.user ?? null
        const p = u ? await getCurrentUserProfile() : null
        set({ user: u, profile: p })
      })
      return
    } catch {
      set({ user: null, profile: null, loading: false })
    }
  },
  login: async (email, password) => {
    set({ loading: true })
    const { user } = await signIn({ email, password })
    const profile = await getCurrentUserProfile()
    set({ user, profile, loading: false })
  },
  logout: async () => {
    set({ loading: true })
    await signOut()
    set({ user: null, profile: null, loading: false })
  },
}))
