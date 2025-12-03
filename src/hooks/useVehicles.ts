import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/services/vehicles'

export function useVehicles() {
  const qc = useQueryClient()
  const list = useQuery({ queryKey: ['vehicles'], queryFn: listVehicles })
  const create = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateVehicle(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
  return { ...list, create, update, remove }
}

