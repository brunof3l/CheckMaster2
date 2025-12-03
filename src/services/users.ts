import { supabase } from '@/config/supabase'

export type DbUser = {
  id: string
  name: string | null
  email: string
  role: 'admin' | 'user'
}

export async function getCurrentUserProfile(): Promise<DbUser | null> {
  const { data: session } = await supabase.auth.getSession()
  const uid = session.session?.user?.id
  if (!uid) return null
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle()
  if (error) throw new Error(error.message)
  return (data ?? null) as DbUser | null
}

