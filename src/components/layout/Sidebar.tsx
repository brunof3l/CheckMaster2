import { NavLink, useNavigate } from 'react-router-dom'
import { CheckSquare, Settings, Car, ClipboardCheck, Users, Shield } from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'

const baseItems = [
  { to: '/checklists', label: 'Checklists', icon: ClipboardCheck },
  { to: '/veiculos', label: 'Veículos', icon: Car },
  { to: '/fornecedores', label: 'Fornecedores', icon: Users },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Sidebar() {
  const profile = useAuthStore((s) => s.profile)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const items = profile?.role === 'admin' ? [...baseItems, { to: '/admin', label: 'Admin', icon: Shield }] : baseItems
  return (
    <aside className="w-64 bg-muted border-r border-border p-4 hidden md:block">
      <div className="flex items-center gap-2 px-2 py-3">
        <CheckSquare className="text-primary" size={22} />
        <span className="font-semibold">CheckMaster</span>
      </div>
      <nav className="mt-4 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md hover:bg-border/40 transition-colors hover-lift',
                isActive && 'bg-border/50'
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-6 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm">{profile?.name ?? 'Usuário'}</div>
            <div className="text-xs text-muted-foreground">{profile?.email}</div>
          </div>
          <Button
            variant="ghost"
            onClick={async () => {
              await logout()
              navigate('/login', { replace: true })
            }}
          >
            Sair
          </Button>
        </div>
      </div>
    </aside>
  )
}
