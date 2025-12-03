import { supabase } from '@/config/supabase'
import type { Supplier } from '@/types'

export async function listSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Supplier[]
}

export async function createSupplier(payload: Partial<Supplier>): Promise<void> {
  console.log('Payload para insert em suppliers:', payload)
  const { data, error } = await supabase.from('suppliers').insert(payload)
  console.log('Resultado insert suppliers:', { data, error })
  if (error) throw new Error(error.message)
}

export async function updateSupplier(id: string, payload: Partial<Supplier>): Promise<void> {
  console.log('Payload para update em suppliers:', { id, payload })
  const { data, error } = await supabase.from('suppliers').update(payload).eq('id', id)
  console.log('Resultado update suppliers:', { data, error })
  if (error) throw new Error(error.message)
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export type SupplierInsert = {
  name: string | null
  cnpj: string
  corporate_name: string
  trade_name: string
  address: string
  phone: string | null
  email: string | null
  contact_name: string | null
  notes: string | null
}

export async function createSupplierRow(payload: SupplierInsert): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(payload)
    .select('*')
    .single()
  return { data, error }
}
