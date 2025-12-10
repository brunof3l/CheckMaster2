import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import DataTable, { Column } from '@/components/ui/DataTable'
import Skeleton from '@/components/ui/Skeleton'
import { useChecklistsList } from '@/hooks/useChecklists'
import type { Checklist } from '@/types'
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getDashboardStats } from '@/services/checklists'
import { useQuery } from '@tanstack/react-query'
import { exportChecklistPDF } from '@/services/pdfExport'
import { FileText, Filter } from 'lucide-react'
import { toast } from 'sonner'

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
  { key: 'created_at', header: 'Criado em', render: (r) => new Date(r.created_at).toLocaleString('pt-BR') },
  {
    key: 'actions',
    header: 'Ações',
    render: (r) => (
      <div className="flex items-center gap-3">
        <Link to={`/checklists/${r.id}`} className="text-primary hover:underline">
          Abrir
        </Link>
        <button
          className="text-primary hover:underline inline-flex items-center gap-1"
          onClick={async () => {
            const t = toast.loading('Gerando PDF...')
            try {
              await exportChecklistPDF(r.id)
              toast.success('PDF gerado', { id: t })
            } catch (e: any) {
              toast.error(e?.message ?? 'Falha ao gerar PDF', { id: t })
            }
          }}
        >
          <FileText size={16} /> Exportar
        </button>
      </div>
    ),
  },
]

export default function Checklists() {
  const [placa, setPlaca] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const s = location.state as any
    if (s?.finalized) {
      toast.success('Checklist finalizado')
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats })

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
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="border border-border md:hidden w-10 h-10 p-0 flex items-center justify-center" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
            <Link to="/checklists/new">
              <Button> Criar Checklist </Button>
            </Link>
          </div>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Em andamento</div>
          <div className="text-3xl font-bold text-primary">{stats?.open ?? 0}</div>
        </Card>
        <Card className={"p-4 " + ((stats?.late ?? 0) > 0 ? "border border-red-500/50 bg-red-500/10" : "") }>
          <div className="text-sm text-red-600">Atenção (+48h)</div>
          <div className="text-3xl font-bold text-red-600">{stats?.late ?? 0}</div>
        </Card>
      </div>
      <div className={`md:block mt-4 ${showFilters ? 'block' : 'hidden'}`}>
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
        </Card>
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
    </div>
  )
}
