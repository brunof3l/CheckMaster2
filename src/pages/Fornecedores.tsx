import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable, { Column } from '@/components/ui/DataTable'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useQueryClient } from '@tanstack/react-query'
import SimpleModal from '@/components/ui/SimpleModal'
import SupplierForm from '@/components/forms/SupplierForm'
import type { Supplier } from '@/types'
import { createSupplierRow } from '@/services/suppliers'
import { useIsAdmin } from '@/hooks/useIsAdmin'

const columns: Column<Supplier>[] = [
  { key: 'display_name', header: 'Nome Fantasia / Razão Social', render: (s) => (s.trade_name ?? s.corporate_name ?? '-') },
  { key: 'cnpj', header: 'CNPJ', render: (s) => s.cnpj ?? '-' },
  { key: 'phone', header: 'Telefone', render: (s) => s.phone ?? '-' },
  { key: 'email', header: 'E-mail', render: (s) => s.email ?? '-' },
]

export default function Fornecedores() {
  const [openNew, setOpenNew] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const { data, create, update, remove } = useSuppliers()
  const qc = useQueryClient()
  const isAdmin = useIsAdmin()

  return (
    <div className="space-y-4">
      <HeaderPage title="Fornecedores" />
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">Cadastro de fornecedores</div>
          <Button onClick={() => setOpenNew(true)}> Novo fornecedor </Button>
          <SimpleModal open={openNew} onClose={() => setOpenNew(false)} title="Novo fornecedor">
            <SupplierForm
              onCancel={() => setOpenNew(false)}
              onSave={async (values) => {
                try {
                  const payload = {
                    name: values.trade_name || values.corporate_name || null,
                    cnpj: values.cnpj,
                    corporate_name: values.corporate_name,
                    trade_name: values.trade_name,
                    address: values.address,
                    phone: values.phone,
                    email: values.email,
                    contact_name: values.contact_name,
                    notes: values.notes,
                  }
                  console.log('Submitting supplier form with values:', values)
                  console.log('Payload para insert em suppliers:', payload)
                  const { data, error } = await createSupplierRow(payload)
                  console.log('Resultado insert suppliers:', { data, error })
                  if (error) throw new Error(error.message)
                  setOpenNew(false)
                  toast.success('Fornecedor criado')
                  await qc.invalidateQueries({ queryKey: ['suppliers'] })
                } catch (e: any) {
                  console.error('Erro ao salvar fornecedor:', e)
                  toast.error(e.message ?? 'Falha ao salvar. Verifique permissões e colunas da tabela suppliers.')
                }
              }}
              loading={create.isPending}
            />
          </SimpleModal>
        </div>
      </Card>
      <DataTable
        columns={[
          ...columns,
          {
            key: 'actions',
            header: 'Ações',
            render: (s) => (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(s as Supplier)}>Editar</Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await remove.mutateAsync((s as Supplier).id)
                        toast.success('Removido')
                      } catch (e: any) {
                        toast.error(e.message)
                      }
                    }}
                  >
                    Remover
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={data ?? []}
      />
      <SimpleModal open={!!editing} onClose={() => setEditing(null)} title="Editar fornecedor">
        {editing && (
          <SupplierForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={async (values) => {
              try {
                const payload = {
                  name: values.trade_name || values.corporate_name || null,
                  cnpj: values.cnpj,
                  corporate_name: values.corporate_name,
                  trade_name: values.trade_name,
                  address: values.address,
                  phone: values.phone,
                  email: values.email,
                  contact_name: values.contact_name,
                  notes: values.notes,
                }
                console.log('Submitting supplier update with values:', values)
                console.log('Payload para update em suppliers:', payload)
                await update.mutateAsync({ id: editing.id, payload: payload as any })
                toast.success('Atualizado')
                setEditing(null)
              } catch (e: any) {
                console.error('Erro ao atualizar fornecedor:', e)
                toast.error(e.message ?? 'Falha ao atualizar fornecedor.')
              }
            }}
            loading={update.isPending}
          />
        )}
      </SimpleModal>
    </div>
  )
}
