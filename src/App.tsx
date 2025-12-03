import { AppRoutes } from '@/router'
import MainLayout from '@/components/layout/MainLayout'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

export default function App() {
  const init = useAuthStore((s) => s.initFromSession)
  useEffect(() => {
    init()
  }, [init])
  return (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  )
}
