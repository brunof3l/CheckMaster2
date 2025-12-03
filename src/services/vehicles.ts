import { supabase } from '@/config/supabase'
import type { Vehicle } from '@/types'

export async function listVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('vehicles').select('*').eq('active', true).order('plate')
  if (error) throw new Error(error.message)
  return (data ?? []) as Vehicle[]
}

export async function createVehicle(payload: Partial<Vehicle>): Promise<void> {
  const { error } = await supabase.from('vehicles').insert(payload)
  if (error) throw new Error(error.message)
}

export async function updateVehicle(id: string, payload: Partial<Vehicle>): Promise<void> {
  const { error } = await supabase.from('vehicles').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').update({ active: false }).eq('id', id)
  if (error) throw new Error(error.message)
}

