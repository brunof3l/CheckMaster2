import { supabase } from '@/config/supabase'
import type { Checklist, ChecklistStatus } from '@/types'

export async function listChecklists({
  search,
  status,
  from,
  to,
}: {
  search?: string
  status?: ChecklistStatus | ''
  from?: string
  to?: string
}): Promise<Checklist[]> {
  let q = supabase
    .from('checklists')
    .select('*, vehicles:vehicle_id(*), suppliers:supplier_id(*)')
    .order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  if (from) q = q.gte('created_at', from)
  if (to) q = q.lte('created_at', to)
  if (search) q = q.or(`vehicles.plate.ilike.%${search}%,suppliers.name.ilike.%${search}%`)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Checklist[]
}

export async function getChecklistById(id: string): Promise<Checklist | null> {
  const { data, error } = await supabase
    .from('checklists')
    .select('*, vehicles:vehicle_id(*), suppliers:supplier_id(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as Checklist
}

export async function createChecklist(payload: Partial<Checklist>): Promise<string> {
  const { data: session } = await supabase.auth.getSession()
  const uid = session.session?.user?.id
  if (!uid) throw new Error('Usuário não autenticado')
  const insertPayload = { ...payload, created_by: uid }
  const { data, error } = await supabase.from('checklists').insert(insertPayload).select('id').single()
  if (error) throw new Error(error.message)
  return data.id as string
}

export async function updateChecklist(id: string, payload: Partial<Checklist>): Promise<void> {
  const { error } = await supabase.from('checklists').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function lockChecklist(id: string): Promise<void> {
  const { error } = await supabase.rpc('finalize_checklist', { cid: id })
  if (error) throw new Error(error.message)
}

export async function deleteChecklist(id: string): Promise<void> {
  const { error } = await supabase.from('checklists').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
