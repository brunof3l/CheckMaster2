import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import DataTable, { Column } from '@/components/ui/DataTable'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { listChecklists, deleteChecklist } from '@/services/checklists'
import type { Checklist } from '@/types'

const ALLOW_DELETE_IN_PROGRESS = true

type RowChecklist = Checklist

export default function ChecklistsAdmin() {
  const qc = useQueryClient()
  const [placa, setPlaca] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-checklists', placa, status, from, to],
    queryFn: () => listChecklists({ search: placa, status: (status as any) || '', from, to }),
  })

  const remove = useMutation({
    mutationFn: async (c: RowChecklist) => {
      if (!ALLOW_DELETE_IN_PROGRESS && c.status === 'em_andamento') throw new Error('Exclusão bloqueada para checklists em andamento')
      const ok = confirm('Tem certeza que deseja excluir este checklist? Esta ação não pode ser desfeita.')
      if (!ok) return
      await deleteChecklist(c.id)
    },
    onSuccess: () => {
      toast.success('Checklist excluído')
      qc.invalidateQueries({ queryKey: ['admin-checklists'] })
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao excluir checklist'),
  })

  const columns: Column<RowChecklist>[] = [
    { key: 'seq', header: 'Nº checklist' },
    { key: 'vehicles.plate', header: 'Placa', render: (r) => r.vehicles?.plate ?? '-' },
    { key: 'suppliers.display_name', header: 'Fornecedor', render: (r) => r.suppliers?.trade_name ?? r.suppliers?.corporate_name ?? '-' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'finalizado' ? 'success' : r.status === 'cancelado' ? 'destructive' : 'warning'}>
          {r.status.replace('_', ' ')}
        </Badge>
      ),
    },
    { key: 'created_at', header: 'Criado em', render: (r) => new Date(r.created_at).toLocaleString('pt-BR') },
    {
      key: 'actions',
      header: 'Ações',
      render: (r) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => remove.mutate(r)}
            disabled={!ALLOW_DELETE_IN_PROGRESS && r.status === 'em_andamento'}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <HeaderPage title="Checklists" />
      <Card className="p-4">
        <div className="text-xs px-3 py-2 rounded-md bg-amber-500/15 text-amber-400">
          Função avançada: exclusão de checklists é permanente.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <Input placeholder="Buscar por placa" value={placa} onChange={(e) => setPlaca(e.target.value)} />
          <select className="rounded-md bg-muted border border-border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="em_andamento">Em andamento</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <DataTable columns={columns} data={(data ?? []) as any} />
        </div>
      </Card>
    </div>
  )
}
