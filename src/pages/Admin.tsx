import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useState } from 'react'
import UsersAdmin from '@/pages/Admin/UsersAdmin'
import VehiclesAdmin from '@/pages/Admin/VehiclesAdmin'
import ChecklistsAdmin from '@/pages/Admin/ChecklistsAdmin'
import SuppliersAdmin from '@/pages/Admin/SuppliersAdmin'
import { useAuthStore } from '@/store/auth'
import { Navigate } from 'react-router-dom'

export default function Admin() {
  const { profile } = useAuthStore()
  const [tab, setTab] = useState<'users' | 'vehicles' | 'checklists' | 'suppliers'>('users')
  if (profile?.role !== 'admin') return <Navigate to="/" replace />

  return (
    <div className="space-y-4">
      <HeaderPage title="Admin" />
      <Card className="p-3">
        <div className="flex gap-2 flex-wrap h-auto w-full">
           <Button variant={tab === 'users' ? 'primary' : 'ghost'} onClick={() => setTab('users')}>Usuários</Button>
           <Button variant={tab === 'vehicles' ? 'primary' : 'ghost'} onClick={() => setTab('vehicles')}>Veículos</Button>
           <Button variant={tab === 'checklists' ? 'primary' : 'ghost'} onClick={() => setTab('checklists')}>Checklists</Button>
           <Button variant={tab === 'suppliers' ? 'primary' : 'ghost'} onClick={() => setTab('suppliers')}>Fornecedores</Button>
         </div>
      </Card>
      {tab === 'users' && <UsersAdmin />}
      {tab === 'vehicles' && <VehiclesAdmin />}
      {tab === 'checklists' && <ChecklistsAdmin />}
      {tab === 'suppliers' && <SuppliersAdmin />}
    </div>
  )
}
