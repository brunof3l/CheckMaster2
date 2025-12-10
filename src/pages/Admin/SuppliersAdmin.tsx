import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/config/supabase'

export default function SuppliersAdmin() {
  const { data, isLoading } = useSuppliers()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  function toggleAll() {
    if ((data ?? []).length === 0) return
    if (selectedIds.length === (data ?? []).length) setSelectedIds([])
    else setSelectedIds((data ?? []).map((s: any) => s.id))
  }

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    const ok = window.confirm(`Excluir ${selectedIds.length} fornecedor(es)?`)
    if (!ok) return
    try {
      setDeleting(true)
      const { error } = await supabase.from('suppliers').delete().in('id', selectedIds)
      if (error) {
        toast.error(error.message ?? 'Falha ao excluir fornecedores.')
        return
      }
      toast.success('Registros removidos com sucesso')
      setSelectedIds([])
    } catch (e: any) {
      toast.error(e.message ?? 'Erro inesperado ao excluir fornecedores')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <HeaderPage title="Admin • Fornecedores" />
      <Card className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-muted-foreground">Gerenciar fornecedores (exclusões)</div>
          <Button onClick={handleBulkDelete} disabled={deleting || selectedIds.length === 0} loading={deleting}>
            Excluir selecionados
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2"><input type="checkbox" checked={(data ?? []).length > 0 && selectedIds.length === (data ?? []).length} onChange={toggleAll} /></th>
                <th className="text-left px-3 py-2 font-medium">CNPJ</th>
                <th className="text-left px-3 py-2 font-medium">Nome</th>
                <th className="text-left px-3 py-2 font-medium">Telefone</th>
                <th className="text-left px-3 py-2 font-medium">E-mail</th>
                <th className="text-left px-3 py-2 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((s: any) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-2"><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggle(s.id)} /></td>
                  <td className="px-3 py-2">{s.cnpj ?? '-'}</td>
                  <td className="px-3 py-2">{s.trade_name ?? s.name ?? s.corporate_name ?? '-'}</td>
                  <td className="px-3 py-2">{s.phone ?? '-'}</td>
                  <td className="px-3 py-2">{s.email ?? '-'}</td>
                  <td className="px-3 py-2">{s.created_at ? new Date(s.created_at).toLocaleString('pt-BR') : '-'}</td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>
                    {isLoading ? 'Carregando...' : 'Nenhum fornecedor encontrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

