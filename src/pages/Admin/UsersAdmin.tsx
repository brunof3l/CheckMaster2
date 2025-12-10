import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import DataTable, { Column } from '@/components/ui/DataTable'
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listUsers, setUserRole, disableUser, resetPassword, type AdminUser } from '@/services/adminUsers'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

export default function UsersAdmin() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const me = useAuthStore((s) => s.user)
  const isMe = (u: AdminUser) => me?.id === u.id
  const { data, isLoading } = useQuery({ queryKey: ['admin-users', search], queryFn: () => listUsers(search) })
  const promote = useMutation({ mutationFn: (u: AdminUser) => setUserRole(u.id, 'admin'), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }) })
  const demote = useMutation({ mutationFn: (u: AdminUser) => setUserRole(u.id, 'user'), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }) })
  const disable = useMutation({ mutationFn: (u: AdminUser) => disableUser(u.id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }) })

  const columns: Column<AdminUser>[] = useMemo(
    () => [
      { key: 'name', header: 'Nome', render: (u) => u.name ?? '-' },
      { key: 'email', header: 'E-mail' },
      {
        key: 'role',
        header: 'Papel',
        render: (u) => (
          <Badge variant={u.role === 'admin' ? 'success' : u.role === 'user' ? 'default' : 'destructive'}>{u.role === 'disabled' ? 'desativado' : u.role}</Badge>
        ),
      },
      { key: 'created_at', header: 'Criado em', render: (u) => new Date(u.created_at).toLocaleString('pt-BR') },
      {
        key: 'actions',
        header: 'Ações',
        render: (u) => (
          <div className="flex gap-2">
            {u.role === 'user' && (
              <Button
                onClick={async () => {
                  try {
                    await promote.mutateAsync(u)
                    toast.success('Usuário promovido a admin')
                  } catch (e: any) {
                    toast.error(e.message ?? 'Falha ao promover')
                  }
                }}
                disabled={isMe(u)}
              >
                Tornar admin
              </Button>
            )}
            {u.role === 'admin' && (
              <Button
                onClick={async () => {
                  try {
                    await demote.mutateAsync(u)
                    toast.success('Permissão admin removida')
                  } catch (e: any) {
                    toast.error(e.message ?? 'Falha ao remover')
                  }
                }}
                disabled={isMe(u)}
              >
                Remover admin
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  await resetPassword(u.email, window.location.origin + '/reset-password')
                  toast.success(`E-mail de redefinição enviado para ${u.email}`)
                } catch (e: any) {
                  toast.error(e.message ?? 'Falha ao enviar e-mail de redefinição')
                }
              }}
            >
              Resetar senha
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                if (!confirm('Confirma desativar este usuário?')) return
                try {
                  await disable.mutateAsync(u)
                  toast.success('Usuário desativado')
                } catch (e: any) {
                  toast.error(e.message ?? 'Falha ao desativar')
                }
              }}
              disabled={isMe(u)}
            >
              Excluir
            </Button>
          </div>
        ),
      },
    ],
    [promote.mutateAsync, demote.mutateAsync, disable.mutateAsync, search]
  )

  return (
    <div className="space-y-4">
      <HeaderPage title="Administração de usuários" />
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Buscar por nome ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <DataTable columns={columns} data={(data ?? []) as any} />
        </div>
+        <div className="mt-4 overflow-x-auto">
+          <DataTable columns={columns} data={(data ?? []) as any} />
+        </div>
      </Card>
    </div>
  )
}
