import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'
import { useNavigate } from 'react-router-dom'

export default function Configuracoes() {
  const profile = useAuthStore((s) => s.profile)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  return (
    <div className="space-y-4">
      <HeaderPage title="Configurações" />
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Sessão</div>
            <div className="text-sm text-muted-foreground">{profile?.email}</div>
          </div>
          <Button onClick={async () => { await logout(); navigate('/login', { replace: true }) }}>Sair</Button>
        </div>
      </Card>
    </div>
  )
}
