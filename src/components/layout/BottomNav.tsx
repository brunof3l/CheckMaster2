import { NavLink } from 'react-router-dom'
import { ClipboardList, Car, Users, Settings, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

export default function BottomNav() {
  const profile = useAuthStore((s) => s.profile)
  const items = [
    { to: '/checklists', label: 'Checklists', icon: ClipboardList },
    { to: '/veiculos', label: 'Veículos', icon: Car },
    { to: '/fornecedores', label: 'Fornecedores', icon: Users },
    { to: '/configuracoes', label: 'Configurações', icon: Settings },
  ]
  const adminItems = profile?.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []
  const navItems = [...items, ...adminItems]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-center h-16 z-50">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 w-full text-xs ${isActive ? 'text-primary' : 'text-foreground'} hover:text-primary transition-colors`
          }
        >
          <Icon size={22} />
          <span className="sr-only">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}