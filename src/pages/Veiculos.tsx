import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import DataTable, { Column } from '@/components/ui/DataTable'
import { useState } from 'react'
import { toast } from 'sonner'
import { useVehicles } from '@/hooks/useVehicles'
import SimpleModal from '@/components/ui/SimpleModal'
import type { Vehicle } from '@/types'

const columns: Column<Vehicle>[] = [
  { key: 'plate', header: 'Placa' },
  { key: 'brand', header: 'Marca' },
  { key: 'model', header: 'Modelo' },
  { key: 'year', header: 'Ano' },
  { key: 'vehicle_type', header: 'Tipo' },
]

export default function Veiculos() {
  const [openNew, setOpenNew] = useState(false)
  const [plate, setPlate] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const { data, create, update, remove } = useVehicles()

  return (
    <div className="space-y-4">
      <HeaderPage title="Veículos" />
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">Cadastro de veículos</div>
          <Button onClick={() => setOpenNew(true)}> Novo veículo </Button>
          <SimpleModal open={openNew} onClose={() => setOpenNew(false)} title="Novo veículo">
            <div className="space-y-3">
              <Input placeholder="Placa" value={plate} onChange={(e) => setPlate(e.target.value)} />
              <Input placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} />
              <Input placeholder="Modelo" value={model} onChange={(e) => setModel(e.target.value)} />
              <Input placeholder="Ano" value={year} onChange={(e) => setYear(e.target.value)} />
              <Input placeholder="Tipo" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpenNew(false)}>Cancelar</Button>
                <Button
                  onClick={async () => {
                    try {
                      if (!plate.trim()) throw new Error('Informe a placa')
                      await create.mutateAsync({ plate: plate.trim().toUpperCase(), brand: brand.trim(), model: model.trim(), year: year.trim(), vehicle_type: vehicleType.trim(), active: true })
                      setPlate('')
                      setBrand('')
                      setModel('')
                      setYear('')
                      setVehicleType('')
                      setOpenNew(false)
                      toast.success('Veículo criado')
                    } catch (e: any) {
                      toast.error(e.message)
                    }
                  }}
                  loading={create.isPending}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </SimpleModal>
        </div>
      </Card>
      <DataTable
        columns={[
          ...columns,
          {
            key: 'actions',
            header: 'Ações',
            render: (v) => (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setEditing(v as Vehicle)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await remove.mutateAsync((v as Vehicle).id)
                      toast.success('Removido')
                    } catch (e: any) {
                      toast.error(e.message)
                    }
                  }}
                >
                  Remover
                </Button>
              </div>
            ),
          },
        ]}
        data={data ?? []}
      />
      <SimpleModal open={!!editing} onClose={() => setEditing(null)} title="Editar veículo">
        <div className="space-y-3">
          <Input placeholder="Placa" value={editing?.plate ?? ''} onChange={(e) => setEditing({ ...(editing as Vehicle), plate: e.target.value })} />
          <Input placeholder="Marca" value={editing?.brand ?? ''} onChange={(e) => setEditing({ ...(editing as Vehicle), brand: e.target.value })} />
          <Input placeholder="Modelo" value={editing?.model ?? ''} onChange={(e) => setEditing({ ...(editing as Vehicle), model: e.target.value })} />
          <Input placeholder="Ano" value={editing?.year ?? ''} onChange={(e) => setEditing({ ...(editing as Vehicle), year: e.target.value })} />
          <Input placeholder="Tipo" value={editing?.vehicle_type ?? ''} onChange={(e) => setEditing({ ...(editing as Vehicle), vehicle_type: e.target.value })} />
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!editing) return
                try {
                  await update.mutateAsync({ id: editing.id, payload: { plate: editing.plate, brand: editing.brand ?? null, model: editing.model ?? null, year: editing.year ?? null, vehicle_type: editing.vehicle_type ?? null } })
                  toast.success('Atualizado')
                  setEditing(null)
                } catch (e: any) {
                  toast.error(e.message)
                }
              }}
              loading={update.isPending}
            >
              Salvar
            </Button>
          </div>
        </div>
      </SimpleModal>
    </div>
  )
}
