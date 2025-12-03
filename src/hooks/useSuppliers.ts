import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/services/suppliers'

export function useSuppliers() {
  const qc = useQueryClient()
  const list = useQuery({ queryKey: ['suppliers'], queryFn: listSuppliers })
  const create = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateSupplier(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
  return { ...list, create, update, remove }
}

