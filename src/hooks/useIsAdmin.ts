import { useAuthStore } from '@/store/auth'

export function useIsAdmin() {
  const { profile } = useAuthStore()
  return profile?.role === 'admin'
}

