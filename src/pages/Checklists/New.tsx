import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ComboBox from '@/components/ui/ComboBox'
import { useVehicles } from '@/hooks/useVehicles'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useCreateChecklist } from '@/hooks/useChecklists'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useState } from 'react'

export default function ChecklistNew() {
  const navigate = useNavigate()
  const { data: vehicles } = useVehicles()
  const { data: suppliers } = useSuppliers()
  const create = useCreateChecklist()
  const [vehicleId, setVehicleId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')

  async function onSave() {
    try {
      const id = await create.mutateAsync({ vehicle_id: vehicleId || null, supplier_id: supplierId || null, notes })
      toast.success('Checklist criado')
      navigate(`/checklists/${id}`, { replace: true })
    } catch (e: any) {
      toast.error(e.message ?? 'Falha ao criar checklist')
    }
  }

  return (
    <div className="space-y-4">
      <HeaderPage title="Novo checklist" />
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(() => {
            const vehicleItems = (vehicles ?? []).map(v => ({
              id: v.id,
              label: `${v.plate} - ${[v.brand, v.model, v.year, v.vehicle_type].filter(Boolean).join(' / ')}`,
            }))
            const selectedVehicle = vehicleItems.find(i => i.id === vehicleId) ?? null
            return (
              <ComboBox
                value={selectedVehicle}
                onChange={(item) => setVehicleId(item.id)}
                items={vehicleItems}
                placeholder="Selecionar veículo"
              />
            )
          })()}
          {(() => {
            const supplierItems = (suppliers ?? []).map(s => ({
              id: s.id,
              label: s.trade_name ?? s.corporate_name ?? '-',
            }))
            const selectedSupplier = supplierItems.find(i => i.id === supplierId) ?? null
            return (
              <ComboBox
                value={selectedSupplier}
                onChange={(item) => setSupplierId(item.id)}
                items={supplierItems}
                placeholder="Selecionar fornecedor"
              />
            )
          })()}
        </div>
        <div>
          <label className="text-sm mb-1 block">Serviço / notas iniciais</label>
          <Input placeholder="Descreva o serviço" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button onClick={onSave} loading={create.isPending}>Salvar</Button>
      </Card>
    </div>
  )
}
