import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listChecklists, getChecklistById, createChecklist, updateChecklist, lockChecklist } from '@/services/checklists'
import type { ChecklistStatus } from '@/types'

export function useChecklistsList(filters: { search?: string; status?: ChecklistStatus | ''; from?: string; to?: string }) {
  return useQuery({ queryKey: ['checklists', filters], queryFn: () => listChecklists(filters) })
}

export function useChecklistDetail(id: string) {
  const qc = useQueryClient()
  const detail = useQuery({ queryKey: ['checklist', id], queryFn: () => getChecklistById(id), enabled: !!id })
  const finalize = useMutation({
    mutationFn: () => lockChecklist(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist', id] }),
  })
  const update = useMutation({
    mutationFn: (payload: any) => updateChecklist(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist', id] }),
  })
  return { ...detail, finalize, update }
}

export function useCreateChecklist() {
  return useMutation({ mutationFn: (payload: any) => createChecklist(payload) })
}

