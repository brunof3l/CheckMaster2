import { supabase } from '@/config/supabase'

export const load = async () => {
  const iso48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const [{ count: abertosCount }, { count: andamentoCount }, { count: finalizadosCount }, { count: over48Count }] = await Promise.all([
    supabase.from('checklists').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento'),
    supabase.from('checklists').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento'),
    supabase.from('checklists').select('*', { count: 'exact', head: true }).eq('status', 'finalizado'),
    supabase.from('checklists').select('*', { count: 'exact', head: true }).lt('created_at', iso48h),
  ])
  return {
    abertos: abertosCount ?? 0,
    andamento: andamentoCount ?? 0,
    finalizados: finalizadosCount ?? 0,
    acima48h: over48Count ?? 0,
  }
}
