import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Progress from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SimpleModal from '@/components/ui/SimpleModal'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/config/supabase'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDebounce } from '@/hooks/useDebounce'
import DefectsStep from '@/pages/Checklists/DefectsStep'
import { ChecklistMediaItem, ChecklistMediaItemWithUrl, uploadChecklistMedia, getChecklistMediaUrls } from '@/services/checklistMedia'
import { Paperclip, CheckCircle } from 'lucide-react'
import SupplierForm from '@/components/forms/SupplierForm'
import { createSupplierRow } from '@/services/suppliers'


type Step = 1 | 2 | 3 | 4

type DefectItem = { key: string; label: string; ok: boolean; notes?: string }
type ItemsPayload = { meta: { service?: string; km?: number; responsavel?: string; defects_note?: string; budget_total?: number; budget_notes?: string }; defects: DefectItem[] }

const defectCatalog: DefectItem[] = [
  { key: 'farol_esq', label: 'Farol Esq.', ok: true },
  { key: 'farol_dir', label: 'Farol Dir.', ok: true },
  { key: 'pisca_esq', label: 'Pisca Esq.', ok: true },
  { key: 'pisca_dir', label: 'Pisca Dir.', ok: true },
  { key: 'lanterna_esq', label: 'Lanterna Esq.', ok: true },
  { key: 'lanterna_dir', label: 'Lanterna Dir.', ok: true },
  { key: 'luz_freio', label: 'Luz Freio', ok: true },
  { key: 'luz_placa', label: 'Luz Placa', ok: true },
  { key: 'buzina', label: 'Buzina', ok: true },

  { key: 'ar_condicionado', label: 'Ar condicionado', ok: true },
  { key: 'retrovisor_interno', label: 'Retrovisor Interno', ok: true },
  { key: 'retrovisor_esq', label: 'Retrovisor Esq.', ok: true },
  { key: 'retrovisor_dir', label: 'Retrovisor Dir.', ok: true },
  { key: 'nivel_oleo_motor', label: 'Nível de Óleo Motor', ok: true },
  { key: 'nivel_oleo_hidraulico', label: 'Nível Óleo Hidráulico', ok: true },
  { key: 'nivel_agua_parabrisa', label: 'Nível Água Parabrisa', ok: true },
  { key: 'nivel_fluido_freio', label: 'Nível Fluido de Freio', ok: true },
  { key: 'nivel_liq_arrefecimento', label: 'Nível Líq. Arrefecimento', ok: true },

  { key: 'limpador_parabrisa', label: 'Limpador Parabrisa', ok: true },
  { key: 'vidros_laterais', label: 'Vidros Laterais', ok: true },
  { key: 'parabrisa_traseiro', label: 'Parabrisa Traseiro', ok: true },
  { key: 'parabrisa_dianteiro', label: 'Parabrisa Dianteiro', ok: true },
  { key: 'vidros_eletricos', label: 'Vidros Elétricos', ok: true },
  { key: 'radio', label: 'Rádio', ok: true },
  { key: 'estofamento_bancos', label: 'Estofamento Bancos', ok: true },
  { key: 'tapetes_internos', label: 'Tapetes Internos', ok: true },
  { key: 'forro_interno', label: 'Forro Interno', ok: true },

  { key: 'macaco', label: 'Macaco', ok: true },
  { key: 'chave_roda', label: 'Chave de Roda', ok: true },
  { key: 'estepe', label: 'Estepe', ok: true },
  { key: 'triangulo', label: 'Triângulo', ok: true },
  { key: 'extintor', label: 'Extintor', ok: true },
  { key: 'bateria', label: 'Bateria', ok: true },
  { key: 'indicadores_painel', label: 'Indicadores Painel', ok: true },
  { key: 'documento_veicular', label: 'Documento Veicular', ok: true },
  { key: 'maca_salao_atend', label: 'Maca e Salão Atend', ok: true },

  { key: 'portas_traseiras', label: 'Portas traseiras', ok: true },
  { key: 'aspecto_geral', label: 'Aspecto Geral', ok: true },
  { key: 'cartao_estacionamento', label: 'Cartão Estacionamento', ok: true },
  { key: 'gps', label: 'GPS', ok: true },
  { key: 'cintos_seguranca', label: 'Cintos de segurança', ok: true },
  { key: 'limpeza_interior', label: 'Limpeza Interior', ok: true },
  { key: 'limpeza_exterior', label: 'Limpeza Exterior', ok: true },
  { key: 'chave_ignicao', label: 'Chave Ignição', ok: true },
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
  const [showVehicleList, setShowVehicleList] = useState(false)
  const [showSupplierList, setShowSupplierList] = useState(false)
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false)
  const [items, setItems] = useState<ItemsPayload>({ meta: {}, defects: defectCatalog })
  const [media, setMedia] = useState<ChecklistMediaItemWithUrl[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [savingPhotos, setSavingPhotos] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [budgetPendingFiles, setBudgetPendingFiles] = useState<File[]>([])
  const [savingBudget, setSavingBudget] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  const photosInputRef = useRef<HTMLInputElement>(null)
  const budgetInputRef = useRef<HTMLInputElement>(null)
  const fuelEntryInputRef = useRef<HTMLInputElement>(null)
  const fuelExitInputRef = useRef<HTMLInputElement>(null)

  const [fuelEntry, setFuelEntry] = useState<{ path: string; created_at: string } | null>(null)
  const [fuelExit, setFuelExit] = useState<{ path: string; created_at: string } | null>(null)
  const [fuelEntryUrl, setFuelEntryUrl] = useState<string | null>(null)
  const [fuelExitUrl, setFuelExitUrl] = useState<string | null>(null)

  const pct = useMemo(() => (step - 1) * 33.34, [step])

  const fmtSeq = useMemo(() => (seq ? `CHECK-${String(seq).padStart(6, '0')}` : 'CHECK-—'), [seq])

  const { register, handleSubmit, setValue, reset, formState, getValues } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

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
    // Buscar por múltiplos campos: name, trade_name e corporate_name
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .or(`name.ilike.%${q}%,trade_name.ilike.%${q}%,corporate_name.ilike.%${q}%`)
      .limit(10)
    if (error) {
      console.error('Erro ao buscar fornecedores:', error.message)
      setSuppliers([])
      return
    }
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
        const existingMedia = (data.media ?? []) as ChecklistMediaItem[]
        const urls = await getChecklistMediaUrls(existingMedia)
        setMedia(urls)
        setFuelEntry((data.fuelGaugePhotos?.entry ?? null) as any)
        setFuelExit((data.fuelGaugePhotos?.exit ?? null) as any)
        const entry = (data.fuelGaugePhotos?.entry ?? null) as { path: string } | null
        const exit = (data.fuelGaugePhotos?.exit ?? null) as { path: string } | null
        if (entry) {
          const { data: u, error } = await supabase.storage.from('checklists').createSignedUrl(entry.path, 3600)
          setFuelEntryUrl(error ? null : u.signedUrl)
        } else setFuelEntryUrl(null)
        if (exit) {
          const { data: u, error } = await supabase.storage.from('checklists').createSignedUrl(exit.path, 3600)
          setFuelExitUrl(error ? null : u.signedUrl)
        } else setFuelExitUrl(null)
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
        .update({ vehicle_id: values.vehicle_id, supplier_id: values.supplier_id, notes: values.notes ?? '', items: payloadItems, created_by: uid })
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
  function removePendingPhoto(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
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
  function removePendingBudget(index: number) {
    setBudgetPendingFiles((prev) => prev.filter((_, i) => i !== index))
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
      const { budget_total, budget_notes, ...cleanMeta } = (items.meta ?? {}) as any
      const payloadItems: ItemsPayload = {
        meta: cleanMeta,
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
    const { data: u, error: urlErr } = await supabase.storage.from('checklists').createSignedUrl(path, 3600)
    if (!urlErr) {
      if (kind === 'entry') setFuelEntryUrl(u.signedUrl)
      else setFuelExitUrl(u.signedUrl)
    }
    toast.success('Foto de combustível enviada')
  }

  async function removeFuel(kind: 'entry' | 'exit') {
    if (!checklistId) return
    if (isLocked) {
      toast.error('Checklist bloqueado')
      return
    }
    const next = {
      entry: kind === 'entry' ? null : fuelEntry,
      exit: kind === 'exit' ? null : fuelExit,
    }
    const { error } = await supabase.from('checklists').update({ fuelGaugePhotos: next }).eq('id', checklistId)
    if (error) return toast.error('Erro ao remover')
    if (kind === 'entry') {
      setFuelEntry(null)
      setFuelEntryUrl(null)
      if (fuelEntryInputRef.current) fuelEntryInputRef.current.value = ''
    } else {
      setFuelExit(null)
      setFuelExitUrl(null)
      if (fuelExitInputRef.current) fuelExitInputRef.current.value = ''
    }
    toast.success('Foto removida')
  }

  async function saveAndExit() {
    if (!checklistId) return
    try {
      setFinalizing(true)

      // Persist pending uploads first
      if (pendingFiles.length > 0) await savePhotos()
      if (budgetPendingFiles.length > 0) await saveBudget()

      // 1) Fetch: get latest items from DB to avoid overwriting defects
      const { data: existing, error: fetchErr } = await supabase
        .from('checklists')
        .select('items')
        .eq('id', checklistId)
        .single()
      if (fetchErr) throw new Error(fetchErr.message)

      const currentItems = (existing?.items ?? {}) as any
      const formValues = getValues() // Step 1 values: service, km, responsavel, notes already handled elsewhere

      // 2) Merge: preserve defects and existing meta, update only form fields and costs
      const mergedItems: any = {
        ...currentItems,
        defects: currentItems?.defects ?? items.defects,
        meta: {
          ...(currentItems?.meta ?? {}),
          service: formValues.service,
          km: Number(formValues.km),
          responsavel: formValues.responsavel,
          budget_total: (items.meta as any)?.budget_total,
          budget_notes: (items.meta as any)?.budget_notes,
        },
      }

      // 3) Update: save merged items back
      const { error: updErr } = await supabase
        .from('checklists')
        .update({ items: mergedItems })
        .eq('id', checklistId)
      if (updErr) throw new Error(updErr.message)

      toast.success('Checklist salvo com sucesso')
      navigate('/checklists')
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar checklist')
    } finally {
      setFinalizing(false)
    }
  }

  async function handleCreateSupplier(values: any) {
    try {
      const payload = {
        name: values.trade_name || values.corporate_name || null,
        cnpj: values.cnpj,
        corporate_name: values.corporate_name,
        trade_name: values.trade_name,
        address: values.address,
        phone: values.phone,
        email: values.email,
        contact_name: values.contact_name,
        notes: values.notes,
      }
      const { data, error } = await createSupplierRow(payload)
      if (error) throw error
      setValue('supplier_id', data.id, { shouldValidate: true })
      const label = data.trade_name || data.corporate_name || data.name || ''
      setSupplierQuery(label)
      setSuppliers([data])
      toast.success('Fornecedor cadastrado e selecionado!')
      setIsNewSupplierOpen(false)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || 'Erro ao cadastrar fornecedor')
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
                <Input placeholder="Buscar veículo" value={vehicleQuery} onChange={(e) => setVehicleQuery(e.target.value)} onFocus={() => setShowVehicleList(true)} onBlur={() => setTimeout(() => setShowVehicleList(false), 200)} />
                {showVehicleList && vehicles.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-auto border border-border rounded-md">
                    {vehicles.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setValue('vehicle_id', v.id, { shouldValidate: true })
                          setVehicleQuery(`${v.plate} - ${[v.brand, v.model, v.year, v.vehicle_type].filter(Boolean).join(' / ')}`)
                          setShowVehicleList(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-border/40"
                      >
                        {v.plate} - {[v.brand, v.model, v.year, v.vehicle_type].filter(Boolean).join(' / ')}
                      </button>
                    ))}
                  </div>
                )}
                {formState.errors.vehicle_id && (
                  <p className="text-xs text-red-400 mt-1">{formState.errors.vehicle_id.message as string}</p>
                )}
              </div>
              <div>
                <label className="text-sm mb-1 block">Fornecedor</label>
                <Input placeholder="Buscar fornecedor" value={supplierQuery} onChange={(e) => setSupplierQuery(e.target.value)} onFocus={() => setShowSupplierList(true)} onBlur={() => setTimeout(() => setShowSupplierList(false), 200)} />
                {showSupplierList && suppliers.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-auto border border-border rounded-md">
                    {suppliers.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setValue('supplier_id', s.id, { shouldValidate: true })
                          const label = s.trade_name ?? s.corporate_name ?? s.name ?? ''
                          setSupplierQuery(label)
                          setShowSupplierList(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-border/40"
                      >
                        {s.trade_name ?? s.corporate_name ?? s.name ?? ''}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setIsNewSupplierOpen(true); setShowSupplierList(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-primary/10 cursor-pointer border-t border-border"
                    >
                      + Cadastrar novo fornecedor
                    </button>
                  </div>
                )}
                {formState.errors.supplier_id && (
                  <p className="text-xs text-red-400 mt-1">{formState.errors.supplier_id.message as string}</p>
                )}
              </div>
              <div>
                <label className="text-sm mb-1 block">Serviço</label>
                <select
                  className="w-full rounded-md bg-muted border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  {...register('service')}
                >
                  <option value="">Selecione o tipo de serviço</option>
                  <option value="Revisão Simples">Revisão Simples</option>
                  <option value="Revisão Geral">Revisão Geral</option>
                  <option value="Preventiva">Preventiva</option>
                  <option value="Corretiva">Corretiva</option>
                </select>
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
          <DefectsStep
            checklistId={checklistId ?? ''}
            initialItems={items.defects}
            initialNotes={(items.meta as any)?.defects_note ?? ''}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
          />
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
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {pendingFiles.map((f, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={URL.createObjectURL(f)}
                        className="w-full h-24 object-cover rounded-md cursor-pointer"
                        onClick={() => setPreviewUrl(URL.createObjectURL(f))}
                      />
                      <button
                        type="button"
                        onClick={() => removePendingPhoto(idx)}
                        className="absolute top-1 right-1 px-2 py-1 text-xs rounded bg-red-600 text-white"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              {media.map((m) => (
                <img
                  key={m.path}
                  src={m.url ?? ''}
                  className="w-full h-24 object-cover rounded-md cursor-pointer"
                  onClick={() => m.url && setPreviewUrl(m.url)}
                />
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={advanceFromPhotos}>Avançar</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="text-sm font-medium">Orçamento</div>
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
                <input
                  ref={budgetInputRef}
                  type="file"
                  multiple
                  accept="application/pdf,image/*"
                  onChange={onPickBudgetFiles}
                  disabled={isLocked}
                  className="hidden"
                />
                <Button variant="ghost" onClick={() => budgetInputRef.current?.click()} disabled={isLocked}>Selecionar arquivos</Button>
                <div className="mt-2 text-xs text-muted-foreground">Arquivos suportados: PDF e imagens • Tamanho adequado</div>
              </div>
              {budgetPendingFiles.length > 0 && (
                <div className="space-y-2">
              {budgetPendingFiles.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Paperclip size={16} className="text-muted-foreground" />
                  <span className="truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
                  <button type="button" className="ml-auto text-xs text-red-500" onClick={() => removePendingBudget(idx)}>Remover</button>
                </div>
              ))}
                </div>
              )}
              <div>
                <Button onClick={saveBudget} loading={savingBudget} disabled={savingBudget || isLocked}>Salvar orçamento</Button>
              </div>
            </div>

            <div className="space-y-3 border rounded-md p-4 bg-muted/20">
              <div className="font-semibold text-sm">Registro de Combustível</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs uppercase text-muted-foreground font-bold">Entrada</div>
                  {fuelEntryUrl ? (
                    <div className="relative group w-full h-40">
                      <img
                        src={fuelEntryUrl}
                        className="w-full h-full object-cover rounded-md border border-border cursor-pointer hover:opacity-90"
                        onClick={() => setPreviewUrl(fuelEntryUrl!)}
                      />
                      <button
                        type="button"
                        onClick={() => removeFuel('entry')}
                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        disabled={isLocked}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={fuelEntryInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && uploadFuel('entry', e.target.files[0])}
                        hidden
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-40 border-2 border-dashed flex flex-col gap-2"
                        onClick={() => fuelEntryInputRef.current?.click()}
                        disabled={isLocked}
                      >
                        <span className="text-2xl">📷</span><span>Anexar Entrada</span>
                      </Button>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase text-muted-foreground font-bold">Saída</div>
                  {fuelExitUrl ? (
                    <div className="relative group w-full h-40">
                      <img
                        src={fuelExitUrl}
                        className="w-full h-full object-cover rounded-md border border-border cursor-pointer hover:opacity-90"
                        onClick={() => setPreviewUrl(fuelExitUrl!)}
                      />
                      <button
                        type="button"
                        onClick={() => removeFuel('exit')}
                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        disabled={isLocked}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={fuelExitInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && uploadFuel('exit', e.target.files[0])}
                        hidden
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-40 border-2 border-dashed flex flex-col gap-2"
                        onClick={() => fuelExitInputRef.current?.click()}
                        disabled={isLocked}
                      >
                        <span className="text-2xl">📷</span><span>Anexar Saída</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(3)}>Voltar</Button>
              <Button onClick={saveAndExit} loading={finalizing} disabled={finalizing || isLocked}>Salvar e Sair</Button>
            </div>
          </div>
        )}
      </Card>
      <SimpleModal open={!!previewUrl} onClose={() => setPreviewUrl(null)} title="Visualização">
        {previewUrl && <img src={previewUrl} className="w-full h-auto rounded-md" />}
      </SimpleModal>
      <SimpleModal open={isNewSupplierOpen} onClose={() => setIsNewSupplierOpen(false)} title="Cadastrar Fornecedor Rápido">
        <SupplierForm onCancel={() => setIsNewSupplierOpen(false)} onSave={handleCreateSupplier} />
      </SimpleModal>
    </div>
  )
}
