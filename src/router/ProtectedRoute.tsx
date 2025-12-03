import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import Skeleton from '@/components/ui/Skeleton'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="p-6"><Skeleton className="h-8" /><Skeleton className="h-96 mt-4" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

