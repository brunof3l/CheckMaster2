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
    .select('*, vehicles:vehicle_id(*), suppliers:supplier_id(*), users:created_by(*)')
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
    .select('*, vehicles:vehicle_id(*), suppliers:supplier_id(*), users:created_by(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  const service = (data?.items as any)?.meta?.service ?? null
  const km = (data?.items as any)?.meta?.km ?? null
  return { ...(data as any), service, km } as Checklist
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

export async function getDashboardStats(): Promise<{ open: number; late: number }> {
  const date48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const [openReq, lateReq] = await Promise.all([
    supabase.from('checklists').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento'),
    supabase
      .from('checklists')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'em_andamento')
      .lt('created_at', date48h),
  ])

  return {
    open: openReq.count ?? 0,
    late: lateReq.count ?? 0,
  }
}
