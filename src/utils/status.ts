import type { ChecklistStatus } from '@/types'

export function statusColor(s: ChecklistStatus) {
  if (s === 'finalizado') return 'success'
  if (s === 'cancelado') return 'destructive'
  return 'warning'
}

