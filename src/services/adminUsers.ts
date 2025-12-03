import { supabase } from '@/config/supabase'

export type AdminUser = { id: string; name: string | null; email: string; role: 'admin' | 'user' | 'disabled'; created_at: string }

export async function listUsers(search?: string): Promise<AdminUser[]> {
  let q = supabase.from('users').select('*').order('created_at', { ascending: false })
  if (search && search.trim().length > 0) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as AdminUser[]
}

export async function setUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  const { error } = await supabase.from('users').update({ role }).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function disableUser(userId: string): Promise<void> {
  const { error } = await supabase.from('users').update({ role: 'disabled' }).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function resetPassword(email: string, redirectTo: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw new Error(error.message)
}
