export type ChecklistStatus = 'em_andamento' | 'finalizado' | 'cancelado'

export type User = {
  id: string
  name: string | null
  email: string
  role: 'admin' | 'user'
}

export type Vehicle = {
  id: string
  plate: string
  brand: string | null
  model: string | null
  year: string | null
  vehicle_type: string | null
  active: boolean
  created_at: string
}
export type Supplier = {
  id: string
  name: string | null
  cnpj: string | null
  corporate_name: string | null
  trade_name: string | null
  address: string | null
  phone: string | null
  email: string | null
  contact_name: string | null
  notes: string | null
  created_at: string
}
export type Checklist = {
  id: string
  seq: number
  status: ChecklistStatus
  created_by: string
  vehicle_id: string | null
  supplier_id: string | null
  notes: string | null
  media: any[]
  items: any | null
  budgetAttachments: any | null
  fuelGaugePhotos: any | null
  is_locked: boolean
  created_at: string
  updated_at: string
  vehicles?: Vehicle | null
  suppliers?: Supplier | null
  users?: User | null
  service?: string | null
  km?: number | null
}
