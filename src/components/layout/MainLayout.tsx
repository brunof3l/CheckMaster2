import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
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
      {/* Sidebar Desktop */}
      {showSidebar && (
        <Sidebar className="hidden md:flex w-64 h-screen sticky top-0 border-r" />
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto mb-16 md:mb-0">
        <PageContainer>
          <PageTransition>{children}</PageTransition>
        </PageContainer>
      </main>

      {/* Menu Mobile Inferior */}
      {showSidebar && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  )
}
