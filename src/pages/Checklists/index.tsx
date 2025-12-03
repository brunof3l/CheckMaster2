import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import DataTable, { Column } from '@/components/ui/DataTable'
import Skeleton from '@/components/ui/Skeleton'
import { useChecklistsList } from '@/hooks/useChecklists'
import type { Checklist } from '@/types'
import { useState } from 'react'
import { Link } from 'react-router-dom'

type ChecklistRow = Checklist

const columns: Column<ChecklistRow>[] = [
  { key: 'seq', header: 'Número' },
  { key: 'vehicles.plate', header: 'Placa', render: (r) => r.vehicles?.plate ?? '-' },
  { key: 'suppliers.display_name', header: 'Fornecedor', render: (r) => r.suppliers?.trade_name ?? r.suppliers?.corporate_name ?? '-' },
  {
    key: 'status',
    header: 'Status',
    render: (r) => (
      <Badge
        variant={r.status === 'finalizado' ? 'success' : r.status === 'cancelado' ? 'destructive' : 'warning'}
      >
        {r.status.replace('_', ' ')}
      </Badge>
    ),
  },
  { key: 'created_at', header: 'Criado em' },
  {
    key: 'actions',
    header: 'Ações',
    render: (r) => (
      <Link to={`/checklists/${r.id}`} className="text-primary hover:underline">
        Abrir
      </Link>
    ),
  },
]

export default function Checklists() {
  const [placa, setPlaca] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading } = useChecklistsList({
    search: placa || fornecedor,
    status: (status as any) || '',
    from,
    to,
  })

  return (
    <div className="space-y-4">
      <HeaderPage
        title="Checklists"
        action={
          <Link to="/checklists/new">
            <Button> Criar Checklist </Button>
          </Link>
        }
      />
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input placeholder="Buscar por placa" value={placa} onChange={(e) => setPlaca(e.target.value)} />
          <Input placeholder="Fornecedor" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
          <select
            className="rounded-md bg-muted border border-border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="em_andamento">Em andamento</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : (
            <DataTable columns={columns} data={(data ?? []) as any} />
          )}
        </div>
      </Card>
    </div>
  )
}
