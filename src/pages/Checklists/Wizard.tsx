import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Progress from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/config/supabase'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDebounce } from '@/hooks/useDebounce'
import { ChecklistMediaItem, ChecklistMediaItemWithUrl, uploadChecklistMedia, getChecklistMediaUrls } from '@/services/checklistMedia'

type Step = 1 | 2 | 3 | 4

type DefectItem = { key: string; label: string; ok: boolean }
type ItemsPayload = { meta: { service?: string; km?: number; responsavel?: string; defects_note?: string; budget_total?: number; budget_notes?: string }; defects: DefectItem[] }

const defectCatalog: DefectItem[] = [
  { key: 'farol_esq', label: 'Farol Esq.', ok: true },
  { key: 'farol_dir', label: 'Farol Dir.', ok: true },
  { key: 'placa_esq', label: 'Placa Esq.', ok: true },
  { key: 'placa_dir', label: 'Placa Dir.', ok: true },
  { key: 'lanternas', label: 'Lanternas', ok: true },
  { key: 'buzina', label: 'Buzina', ok: true },
  { key: 'ar_condicionado', label: 'Ar condicionado', ok: true },
  { key: 'limpador', label: 'Limpador', ok: true },
  { key: 'extintor', label: 'Extintor', ok: true },
  { key: 'triangulo', label: 'Triângulo', ok: true },
  { key: 'documentos', label: 'Documentos', ok: true },
  { key: 'chave_de_roda', label: 'Chave de roda', ok: true },
]

const schema = z.object({
  service: z.string().min(1, 'Informe o serviço'),
  notes: z.string().optional(),
  km: z.coerce.number().nonnegative(),
  responsavel: z.string().min(2, 'Informe o responsável'),
  vehicle_id: z.string().min(1, 'Selecione o veículo'),
  supplier_id: z.string().min(1, 'Selecione o fornecedor'),
})

export default function ChecklistWizard() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [step, setStep] = useState<Step>(1)
  const [checklistId, setChecklistId] = useState<string | null>(null)
  const [seq, setSeq] = useState<number | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [vehicleQuery, setVehicleQuery] = useState('')
  const [supplierQuery, setSupplierQuery] = useState('')
  const [items, setItems] = useState<ItemsPayload>({ meta: {}, defects: defectCatalog })
  const [media, setMedia] = useState<ChecklistMediaItemWithUrl[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [savingPhotos, setSavingPhotos] = useState(false)

  const [budgetTotal, setBudgetTotal] = useState<number>(0)
  const [budgetNotes, setBudgetNotes] = useState('')
  const [budgetPendingFiles, setBudgetPendingFiles] = useState<File[]>([])
  const [savingBudget, setSavingBudget] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  const photosInputRef = useRef<HTMLInputElement>(null)
  const budgetInputRef = useRef<HTMLInputElement>(null)
  const fuelEntryInputRef = useRef<HTMLInputElement>(null)
  const fuelExitInputRef = useRef<HTMLInputElement>(null)

  const [fuelEntry, setFuelEntry] = useState<{ path: string; created_at: string } | null>(null)
  const [fuelExit, setFuelExit] = useState<{ path: string; created_at: string } | null>(null)

  const pct = useMemo(() => (step - 1) * 33.34, [step])

  const fmtSeq = useMemo(() => (seq ? `CHECK-${String(seq).padStart(6, '0')}` : 'CHECK-—'), [seq])

  const { register, handleSubmit, setValue, reset, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  const fetchVehicles = useDebounce(async (q: string) => {
    if (!q) return setVehicles([])
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('active', true)
      .ilike('plate', `%${q}%`)
      .limit(10)
    setVehicles(data ?? [])
  }, 300)

  const fetchSuppliers = useDebounce(async (q: string) => {
    if (!q) return setSuppliers([])
    const { data } = await supabase.from('suppliers').select('*').ilike('name', `%${q}%`).limit(10)
    setSuppliers(data ?? [])
  }, 300)

  useEffect(() => {
    if (vehicleQuery) fetchVehicles(vehicleQuery)
  }, [vehicleQuery])

  useEffect(() => {
    if (supplierQuery) fetchSuppliers(supplierQuery)
  }, [supplierQuery])

  useEffect(() => {
    ;(async () => {
      if (id) {
        const { data, error } = await supabase
          .from('checklists')
          .select('id, seq, status, is_locked, vehicle_id, supplier_id, notes, items, media, budgetAttachments, fuelGaugePhotos')
          .eq('id', id)
          .single()
        if (error) return
        setChecklistId(data.id)
        setSeq(data.seq ?? null)
        setIsLocked(!!data.is_locked || data.status === 'finalizado')
        const meta = (data.items?.meta ?? {}) as ItemsPayload['meta']
        const defects = (data.items?.defects ?? defectCatalog) as DefectItem[]
        setItems({ meta, defects })
        setBudgetTotal(Number(meta?.budget_total ?? 0))
        setBudgetNotes(String(meta?.budget_notes ?? ''))
        const existingMedia = (data.media ?? []) as ChecklistMediaItem[]
        const urls = await getChecklistMediaUrls(existingMedia)
        setMedia(urls)
        setFuelEntry((data.fuelGaugePhotos?.entry ?? null) as any)
        setFuelExit((data.fuelGaugePhotos?.exit ?? null) as any)
        reset({
          service: meta.service ?? '',
          notes: data.notes ?? '',
          km: meta.km ?? 0,
          responsavel: meta.responsavel ?? '',
          vehicle_id: data.vehicle_id ?? '',
          supplier_id: data.supplier_id ?? '',
        })
      }
    })()
  }, [id])

  async function onNextStep1(values: z.infer<typeof schema>) {
    if (isLocked) {
      toast.error('Checklist bloqueado')
      return
    }
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user?.id
    if (!uid) {
      toast.error('Sessão inválida')
      return
    }
    const payloadItems: ItemsPayload = {
      meta: { service: values.service, km: values.km, responsavel: values.responsavel, defects_note: items.meta.defects_note },
      defects: items.defects,
    }
    if (!checklistId) {
      const { data, error } = await supabase
        .from('checklists')
        .insert({ created_by: uid, status: 'em_andamento', vehicle_id: values.vehicle_id, supplier_id: values.supplier_id, notes: values.notes ?? '', items: payloadItems })
        .select('id, seq')
        .single()
      if (error) {
        toast.error(error.message)
        return
      }
      setChecklistId(data.id)
      setSeq(data.seq ?? null)
      toast.success('Checklist criado')
    } else {
      const { error } = await supabase
        .from('checklists')
        .update({ vehicle_id: values.vehicle_id, supplier_id: values.supplier_id, notes: values.notes ?? '', items: payloadItems })
        .eq('id', checklistId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Dados atualizados')
    }
    setStep(2)
  }

  async function saveItemsAndGo(target: Step) {
    if (!checklistId) return
    const { error } = await supabase.from('checklists').update({ items }).eq('id', checklistId)
    if (error) {
      toast.error(error.message)
      return
    }
    setStep(target)
  }

  function toggleDefect(k: string, ok: boolean) {
    setItems((prev) => ({ ...prev, defects: prev.defects.map((d) => (d.key === k ? { ...d, ok } : d)) }))
  }

  function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setPendingFiles((prev) => [...prev, ...files])
  }

  async function savePhotos() {
    if (!checklistId) return
    if (pendingFiles.length === 0) return
    try {
      setSavingPhotos(true)
      const updated = await uploadChecklistMedia(
        checklistId,
        pendingFiles,
        media.map(({ url, ...rest }) => rest)
      )
      const withUrls = await getChecklistMediaUrls(updated)
      setMedia(withUrls)
      setPendingFiles([])
      toast.success('Fotos enviadas')
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao enviar fotos')
    } finally {
      setSavingPhotos(false)
    }
  }

  async function advanceFromPhotos() {
    if (isLocked) return setStep(4)
    if (pendingFiles.length > 0) await savePhotos()
    setStep(4)
  }

  function onPickBudgetFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setBudgetPendingFiles((prev) => [...prev, ...files])
  }

  async function saveBudget() {
    if (!checklistId) return
    try {
      setSavingBudget(true)
      const { data: existing } = await supabase
        .from('checklists')
        .select('budgetAttachments')
        .eq('id', checklistId)
        .single()
      const current = (existing?.budgetAttachments ?? []) as { path: string; name?: string; size?: number; type?: string; created_at: string }[]
      const next = [...current]
      if (budgetPendingFiles.length > 0) {
        for (const f of budgetPendingFiles) {
          const ext = f.name.toLowerCase().match(/\.(pdf|jpg|jpeg|png|webp)$/)?.[1] ?? 'pdf'
          const path = `${checklistId}/budget/${crypto.randomUUID()}.${ext}`
          const { error: upErr } = await supabase.storage.from('checklists').upload(path, f, { upsert: false })
          if (upErr) throw new Error(upErr.message)
          next.push({ path, name: f.name, size: f.size, type: f.type || `application/${ext}`, created_at: new Date().toISOString() })
        }
      }
      const payloadItems: ItemsPayload = {
        meta: { ...items.meta, budget_total: budgetTotal, budget_notes: budgetNotes },
        defects: items.defects,
      }
      const { error } = await supabase
        .from('checklists')
        .update({ items: payloadItems, budgetAttachments: next })
        .eq('id', checklistId)
      if (error) throw new Error(error.message)
      setItems(payloadItems)
      setBudgetPendingFiles([])
      toast.success('Orçamento salvo')
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar orçamento')
    } finally {
      setSavingBudget(false)
    }
  }

  async function uploadFuel(kind: 'entry' | 'exit', file: File) {
    if (!checklistId) return
    const path = `${checklistId}/fuel/${kind}-${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage.from('checklists').upload(path, file, { upsert: false })
    if (error) throw new Error(error.message)
    const created = { path, created_at: new Date().toISOString() }
    const next = {
      entry: kind === 'entry' ? created : fuelEntry,
      exit: kind === 'exit' ? created : fuelExit,
    }
    const { error: updErr } = await supabase.from('checklists').update({ fuelGaugePhotos: next }).eq('id', checklistId)
    if (updErr) throw new Error(updErr.message)
    setFuelEntry(next.entry as any)
    setFuelExit(next.exit as any)
    toast.success('Foto de combustível enviada')
  }

  async function finalizeChecklist() {
    if (!checklistId) return
    try {
      setFinalizing(true)
      if (pendingFiles.length > 0) await savePhotos()
      if (budgetPendingFiles.length > 0) await saveBudget()
      const payloadItems: ItemsPayload = {
        meta: { ...items.meta, budget_total: budgetTotal, budget_notes: budgetNotes },
        defects: items.defects,
      }
      const { error } = await supabase
        .from('checklists')
        .update({ items: payloadItems, status: 'finalizado', is_locked: true })
        .eq('id', checklistId)
      if (error) throw new Error(error.message)
      toast.success('Checklist finalizado')
      navigate(`/checklists/${checklistId}`)
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao finalizar checklist')
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div className="space-y-4">
      <HeaderPage title="Checklist" />
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={"px-2 py-1 rounded-md text-xs " + (step === 1 ? 'bg-primary text-white' : 'bg-muted')}>1 Dados</div>
            <div className={"px-2 py-1 rounded-md text-xs " + (step === 2 ? 'bg-primary text-white' : 'bg-muted')}>2 Defeitos</div>
            <div className={"px-2 py-1 rounded-md text-xs " + (step === 3 ? 'bg-primary text-white' : 'bg-muted')}>3 Fotos</div>
            <div className={"px-2 py-1 rounded-md text-xs " + (step === 4 ? 'bg-primary text-white' : 'bg-muted')}>4 Custos</div>
          </div>
          <div className="text-sm text-muted-foreground">{fmtSeq}</div>
        </div>
        <div className="mt-3">
          <Progress value={pct} />
        </div>
      </Card>

      <Card className="p-4">
        {isLocked && <div className="mb-3 text-xs px-3 py-2 rounded-md bg-amber-500/15 text-amber-400">Checklist finalizado — somente leitura</div>}
        {step === 1 && (
          <form className="space-y-4" onSubmit={handleSubmit(onNextStep1)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm mb-1 block">Placa</label>
                <Input placeholder="Buscar veículo" value={vehicleQuery} onChange={(e) => setVehicleQuery(e.target.value)} />
                <div className="mt-2 max-h-40 overflow-auto border border-border rounded-md">
                  {vehicles.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setValue('vehicle_id', v.id, { shouldValidate: true })
                        setVehicleQuery(`${v.plate} - ${[v.brand, v.model, v.year, v.vehicle_type].filter(Boolean).join(' / ')}`)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-border/40"
                    >
                      {v.plate} - {[v.brand, v.model, v.year, v.vehicle_type].filter(Boolean).join(' / ')}
                    </button>
                  ))}
                </div>
                {formState.errors.vehicle_id && (
                  <p className="text-xs text-red-400 mt-1">{formState.errors.vehicle_id.message as string}</p>
                )}
              </div>
              <div>
                <label className="text-sm mb-1 block">Fornecedor</label>
                <Input placeholder="Buscar fornecedor" value={supplierQuery} onChange={(e) => setSupplierQuery(e.target.value)} />
                <div className="mt-2 max-h-40 overflow-auto border border-border rounded-md">
                  {suppliers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setValue('supplier_id', s.id, { shouldValidate: true })
                        setSupplierQuery(s.name)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-border/40"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                {formState.errors.supplier_id && (
                  <p className="text-xs text-red-400 mt-1">{formState.errors.supplier_id.message as string}</p>
                )}
              </div>
              <div>
                <label className="text-sm mb-1 block">Serviço</label>
                <Input placeholder="Descrição do serviço" {...register('service')} />
                {formState.errors.service && (
                  <p className="text-xs text-red-400 mt-1">{formState.errors.service.message as string}</p>
                )}
              </div>
              <div>
                <label className="text-sm mb-1 block">KM</label>
                <Input type="number" placeholder="0" {...register('km')} />
                {formState.errors.km && (
                  <p className="text-xs text-red-400 mt-1">{formState.errors.km.message as string}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm mb-1 block">Observação</label>
                <textarea
                  className="w-full min-h-24 rounded-md bg-muted border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  {...register('notes')}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm mb-1 block">Responsável</label>
                <Input placeholder="Nome" {...register('responsavel')} />
                {formState.errors.responsavel && (
                  <p className="text-xs text-red-400 mt-1">{formState.errors.responsavel.message as string}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">Avançar</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {items.defects.map((d) => (
                <label key={d.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={d.ok}
                    onChange={(e) => toggleDefect(d.key, e.target.checked)}
                  />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
            <div>
              <textarea
                className="w-full min-h-24 rounded-md bg-muted border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={items.meta.defects_note ?? ''}
                onChange={(e) => setItems((prev) => ({ ...prev, meta: { ...prev.meta, defects_note: e.target.value } }))}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => saveItemsAndGo(1)}>Voltar</Button>
              <div className="flex gap-2">
                <Button onClick={() => saveItemsAndGo(3)}>Avançar</Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Fotos</div>
            <div className="flex items-center gap-3">
              <input ref={photosInputRef} type="file" accept="image/*" multiple onChange={onPickPhotos} disabled={isLocked} className="hidden" />
              <Button variant="ghost" onClick={() => photosInputRef.current?.click()} disabled={isLocked}>Selecionar fotos</Button>
              <Button onClick={savePhotos} loading={savingPhotos} disabled={savingPhotos || pendingFiles.length === 0 || isLocked}>Salvar fotos</Button>
            </div>
            {pendingFiles.length > 0 && (
              <div className="text-xs text-muted-foreground">{pendingFiles.length} arquivo(s) para enviar</div>
            )}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              {media.map((m) => (
                <img key={m.path} src={m.url ?? ''} className="w-full h-24 object-cover rounded-md" />
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={advanceFromPhotos}>Avançar</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Custos</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm mb-1 block">Total</label>
                <Input type="number" value={budgetTotal} onChange={(e) => setBudgetTotal(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm mb-1 block">Notas do orçamento</label>
                <Input value={budgetNotes} onChange={(e) => setBudgetNotes(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input ref={budgetInputRef} type="file" multiple accept="application/pdf,image/*" onChange={onPickBudgetFiles} disabled={isLocked} className="hidden" />
              <Button variant="ghost" onClick={() => budgetInputRef.current?.click()} disabled={isLocked}>Selecionar arquivos</Button>
              <Button onClick={saveBudget} loading={savingBudget} disabled={savingBudget || isLocked}>Salvar orçamento</Button>
            </div>
            {budgetPendingFiles.length > 0 && (
              <div className="text-xs text-muted-foreground">{budgetPendingFiles.length} arquivo(s) para anexar</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-sm">Entrada</div>
                <input ref={fuelEntryInputRef} type="file" accept="image/*" onChange={(e) => e.target.files && uploadFuel('entry', e.target.files[0])} disabled={isLocked} className="hidden" />
                <Button variant="ghost" onClick={() => fuelEntryInputRef.current?.click()} disabled={isLocked}>Anexar foto de entrada</Button>
                {fuelEntry && <div className="text-xs text-muted-foreground">Anexado</div>}
              </div>
              <div className="space-y-2">
                <div className="text-sm">Saída</div>
                <input ref={fuelExitInputRef} type="file" accept="image/*" onChange={(e) => e.target.files && uploadFuel('exit', e.target.files[0])} disabled={isLocked} className="hidden" />
                <Button variant="ghost" onClick={() => fuelExitInputRef.current?.click()} disabled={isLocked}>Anexar foto de saída</Button>
                {fuelExit && <div className="text-xs text-muted-foreground">Anexado</div>}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(3)}>Voltar</Button>
              <Button onClick={finalizeChecklist} loading={finalizing} disabled={finalizing || isLocked}>Finalizar</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
