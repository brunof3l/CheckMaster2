import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import DataTable, { Column } from '@/components/ui/DataTable'
import SimpleModal from '@/components/ui/SimpleModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/config/supabase'
import type { Vehicle } from '@/types'
import * as XLSX from 'xlsx'
import { useAuthStore } from '@/store/auth'

type RowVehicle = Vehicle

export default function VehiclesAdmin() {
  const qc = useQueryClient()
  const profile = useAuthStore((s) => s.profile)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<RowVehicle | null>(null)
  const [plate, setPlate] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [active, setActive] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<string>('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const masterRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vehicles', search],
    queryFn: async () => {
      let q = supabase.from('vehicles').select('*').order('created_at', { ascending: false })
      if (search.trim()) q = q.eq('active', true).ilike('plate', `%${search}%`)
      const { data, error } = await q
      if (error) throw new Error(error.message)
      return (data ?? []) as RowVehicle[]
    },
  })

  const activeIds = (data ?? []).filter((v) => v.active).map((v) => v.id)
  const allActiveSelected = activeIds.length > 0 && activeIds.every((id) => selectedIds.includes(id))
  const someSelected = selectedIds.length > 0 && !allActiveSelected

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleSelectAll() {
    if (allActiveSelected) setSelectedIds([])
    else setSelectedIds(activeIds)
  }

  function clearSelection() {
    setSelectedIds([])
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return
      const { error } = await supabase
        .from('vehicles')
        .update({ plate, brand, model, year, vehicle_type: vehicleType, active })
        .eq('id', editing.id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Veículo atualizado')
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['admin-vehicles'] })
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao salvar veículo'),
  })

  const softDelete = useMutation({
    mutationFn: async (v: RowVehicle) => {
      const { error } = await supabase.from('vehicles').update({ active: false }).eq('id', v.id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Veículo desativado')
      qc.invalidateQueries({ queryKey: ['admin-vehicles'] })
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao desativar veículo'),
  })

  const bulkDisable = useMutation({
    mutationFn: async () => {
      if (selectedIds.length === 0) return
      const { error } = await supabase.from('vehicles').update({ active: false }).in('id', selectedIds)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success(`${selectedIds.length} veículo(s) desativados com sucesso`)
      clearSelection()
      qc.invalidateQueries({ queryKey: ['admin-vehicles'] })
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro na desativação em massa'),
  })

  const bulkDelete = useMutation({
    mutationFn: async () => {
      if (selectedIds.length === 0) return
      const { error } = await supabase.from('vehicles').delete().in('id', selectedIds)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success(`${selectedIds.length} veículo(s) excluídos com sucesso`)
      clearSelection()
      qc.invalidateQueries({ queryKey: ['admin-vehicles'] })
      setDeleteConfirmOpen(false)
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro na exclusão em massa'),
  })

  const columns: Column<RowVehicle>[] = [
    {
      key: 'select',
      header: (
        <input
          ref={masterRef}
          type="checkbox"
          checked={allActiveSelected}
          onChange={toggleSelectAll}
        />
      ),
      render: (v) => (
        <input type="checkbox" disabled={!v.active} checked={selectedIds.includes(v.id)} onChange={() => toggleSelect(v.id)} />
      ),
    },
    { key: 'plate', header: 'Placa' },
    { key: 'brand', header: 'Marca' },
    { key: 'model', header: 'Modelo' },
    { key: 'year', header: 'Ano' },
    { key: 'vehicle_type', header: 'Tipo' },
    {
      key: 'active',
      header: 'Ativo',
      render: (v) => <Badge variant={v.active ? 'success' : 'destructive'}>{v.active ? 'sim' : 'inativo'}</Badge>,
    },
    { key: 'created_at', header: 'Criado em', render: (v) => new Date(v.created_at).toLocaleString('pt-BR') },
    {
      key: 'actions',
      header: 'Ações',
      render: (v) => (
        <div className={"flex gap-2 " + (v.active ? '' : 'opacity-60')}>
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(v)
              setPlate(v.plate)
              setBrand(v.brand ?? '')
              setModel(v.model ?? '')
              setYear(v.year ?? '')
              setVehicleType(v.vehicle_type ?? '')
              setActive(v.active)
            }}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (!confirm('Confirma desativar este veículo?')) return
              softDelete.mutate(v)
            }}
            disabled={!v.active}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ]

  if (masterRef.current) masterRef.current.indeterminate = someSelected

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImporting(true)
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const wsName = wb.SheetNames[0]
      const ws = wb.Sheets[wsName]
      const objs: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const seen = new Set<string>()
      const { data: existingPlatesData } = await supabase.from('vehicles').select('plate')
      const existing = new Set<string>((existingPlatesData ?? []).map((v: any) => String(v.plate ?? '').toUpperCase()))
      const out: { plate: string; brand: string; model: string; year: string; vehicle_type: string; active: boolean }[] = []
      let ignored = 0
      for (const row of objs) {
        const placa = String(row['Placa'] ?? '').trim().toUpperCase()
        if (!placa) {
          ignored++
          continue
        }
        if (seen.has(placa) || existing.has(placa)) {
          ignored++
          continue
        }
        seen.add(placa)
        const marca = String(row['Marca'] ?? '').trim()
        const modelo = String(row['Modelo'] ?? '').trim()
        const ano = String(row['Ano'] ?? '').trim()
        const tipo = String(row['Tipo'] ?? '').trim()
        out.push({ plate: placa, brand: marca, model: modelo, year: ano, vehicle_type: tipo, active: true })
      }
      let inserted = 0
      if (out.length > 0) {
        const { error } = await supabase.from('vehicles').insert(out)
        if (error) throw new Error(error.message)
        inserted = out.length
      }
      const summary = `${inserted} veículos importados, ${ignored} linha(s) ignorada(s).`
      setImportSummary(summary)
      toast.success(summary)
      qc.invalidateQueries({ queryKey: ['admin-vehicles'] })
      e.target.value = ''
    } catch (err: any) {
      toast.error(err.message ?? 'Falha na importação')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <HeaderPage title="Veículos" />
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Importar veículos em massa</h3>
        <div className="flex items-center gap-3">
          {profile?.role === 'admin' && (
            <>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImport} />
              <Button variant="ghost" onClick={() => fileRef.current?.click()} loading={importing}>Selecionar arquivo</Button>
              {importing && <span className="text-xs text-muted-foreground">Importando…</span>}
            </>
          )}
          <div className="ml-auto">
            <Button
              variant="ghost"
              className="text-red-500 border-red-600 hover:bg-red-600/10"
              disabled={selectedIds.length === 0}
              onClick={() => {
                if (selectedIds.length === 0) return
                const ok = confirm(`Você está prestes a desativar ${selectedIds.length} veículo(s). Tem certeza?`)
                if (!ok) return
                bulkDisable.mutate()
              }}
              loading={bulkDisable.isPending}
            >
              Desativar selecionados
            </Button>
            <Button
              variant="ghost"
              className="ml-2 bg-red-600/20 text-red-600 border-red-600 hover:bg-red-600/30"
              disabled={selectedIds.length === 0}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Excluir selecionados
            </Button>
          </div>
        </div>
        {importSummary && <div className="mt-2 text-xs text-muted-foreground">{importSummary}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <Input placeholder="Buscar por placa" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <DataTable columns={columns} data={(data ?? []) as any} rowClassName={(v) => (v.active ? '' : 'opacity-60')} />
        </div>
      </Card>

      <SimpleModal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Excluir veículos selecionados">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Você está prestes a excluir definitivamente {selectedIds.length} veículo(s). Essa ação não pode ser desfeita. Tem certeza que deseja continuar?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={() => bulkDelete.mutate()} loading={bulkDelete.isPending} className="bg-red-600 text-white hover:bg-red-700 border-red-700">
              Confirmar exclusão
            </Button>
          </div>
        </div>
      </SimpleModal>

      <SimpleModal open={!!editing} onClose={() => setEditing(null)} title="Editar veículo">
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm mb-1 block">Placa</label>
                <Input value={plate} onChange={(e) => setPlate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm mb-1 block">Marca</label>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div>
                <label className="text-sm mb-1 block">Modelo</label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div>
                <label className="text-sm mb-1 block">Ano</label>
                <Input value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div>
                <label className="text-sm mb-1 block">Tipo</label>
                <Input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                <span className="text-sm">Ativo</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={() => save.mutate()} loading={save.isPending}>Salvar</Button>
            </div>
          </div>
      </SimpleModal>
    </div>
  )
}