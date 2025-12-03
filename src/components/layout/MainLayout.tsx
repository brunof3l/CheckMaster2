import Sidebar from '@/components/layout/Sidebar'
import PageContainer from '@/components/ui/PageContainer'
import PageTransition from '@/components/ui/PageTransition'
import { useAuthStore } from '@/store/auth'
import { useLocation } from 'react-router-dom'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const { pathname } = useLocation()
  const showSidebar = !!user && pathname !== '/login' && pathname !== '/register'
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {showSidebar && <Sidebar />}
      <PageContainer>
        <PageTransition>{children}</PageTransition>
      </PageContainer>
    </div>
  )
}
