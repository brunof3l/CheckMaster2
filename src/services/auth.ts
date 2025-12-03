import { supabase } from '@/config/supabase'
import type { Session, User } from '@supabase/supabase-js'

export type DbUser = {
  id: string
  name: string | null
  email: string
  role: 'admin' | 'user'
}

export async function signUp({ name, email, password }: { name: string; email: string; password: string }) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    const user = data.user
    if (!user) throw new Error('Usuário não retornado')
    return { user }
  } catch (e: any) {
    throw new Error(e.message ?? 'Falha ao criar conta')
  }
}

export async function signIn({ email, password }: { email: string; password: string }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return { session: data.session as Session, user: data.user as User }
  } catch (e: any) {
    throw new Error(e.message ?? 'Falha ao entrar')
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (e: any) {
    throw new Error(e.message ?? 'Falha ao sair')
  }
}

export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session as Session | null
  } catch (e: any) {
    throw new Error(e.message ?? 'Falha ao obter sessão')
  }
}

export async function getCurrentUserProfile() {
  try {
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user?.id
    if (!uid) return null
    const { data, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle()
    if (error) throw error
    return (data ?? null) as DbUser | null
  } catch (e: any) {
    // Se não há perfil, retorne null sem falhar o fluxo
    return null
  }
}
