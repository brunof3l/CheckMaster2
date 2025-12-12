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
import { Paperclip, CheckCircle, DollarSign, X, Save, CheckCircle2, Upload, Camera, Trash2 } from 'lucide-react'
import SupplierForm from '@/components/forms/SupplierForm'
import { createSupplierRow } from '@/services/suppliers'
import { useAuthStore } from '@/store/auth'
import imageCompression from 'browser-image-compression'


type Step = 1 | 2 | 3 | 4

type DefectItem = { key: string; label: string; ok: boolean; notes?: string }
type ItemsPayload = {
  meta: {
    service?: string;
    km?: number;
    responsavel?: string;
    plate?: string;
    defects_note?: string | null;
    budget_total?: number | null | undefined;
    budget_notes?: string | null | undefined;
  };
  defects: DefectItem[];
}

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
  plate: z.string().optional(), // campo opcional para placa
})

export default function ChecklistWizard() {
  const navigate = useNavigate()
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
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
  const [loading, setLoading] = useState(false)

  // Estado local para arquivos de orçamento exibidos na UI do Passo 4
  const [budget, setBudget] = useState<File[]>([])

  // Valores do orçamento vindos de items.meta (safe)
  const budgetTotal = (items?.meta as any)?.budget_total ?? null
  const budgetNotes = (items?.meta as any)?.budget_notes ?? ''

  // Helpers para atualizar items.meta sem duplicar estado
  const setBudgetTotal = (val: number | null) =>
    setItems((prev) => ({ ...prev, meta: { ...prev.meta, budget_total: val ?? null } }))
  const setBudgetNotes = (val: string) =>
    setItems((prev) => ({ ...prev, meta: { ...prev.meta, budget_notes: val || null } }))

  const photosInputRef = useRef<HTMLInputElement>(null)
  const budgetInputRef = useRef<HTMLInputElement>(null)
  const fuelEntryInputRef = useRef<HTMLInputElement>(null)
  const fuelExitInputRef = useRef<HTMLInputElement>(null)

  // Mantém sempre a versão mais atual dos itens para o salvamento de emergência
  const itemsRef = useRef(items)
  const budgetRef = useRef(budget)
  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => { budgetRef.current = budget }, [budget])

  const isSavingRef = useRef(false)
  const isFinalizingRef = useRef(false)
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

  // Carregar dados se for edição ou rascunho
  useEffect(() => {
    const loadChecklist = async () => {
      // Pega o ID da URL ou da prop
      const targetId = id || new URLSearchParams(window.location.search).get('id')
      if (!targetId) return

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('checklists')
          .select('*')
          .eq('id', targetId)
          .single()

        if (error) throw error

        if (data) {
          // 1. Restaura o ID e Status
          setChecklistId(data.id)

          // 2. Restaura Itens (Defeitos e meta)
          const loadedItems = data.items || { defects: [], meta: {} }
          setItems(loadedItems)
          itemsRef.current = loadedItems

          // 3. Restaura Campos do Formulário (Passo 1)
          setValue('km', loadedItems.meta?.km || '')
          setValue('service', loadedItems.meta?.service || '')
          setValue('responsavel', loadedItems.meta?.responsavel || '')
          if (loadedItems.meta?.plate) setValue('plate', loadedItems.meta.plate)
          if (data.vehicle_id) {
            setValue('vehicle_id', data.vehicle_id)
            // Preenche label visível da busca de veículo
            try {
              const { data: v } = await supabase
                .from('vehicles')
                .select('id, plate, brand, model, year, vehicle_type')
                .eq('id', data.vehicle_id)
                .single()
              if (v) setVehicleQuery(`${v.plate} - ${[v.brand, v.model, v.year, v.vehicle_type].filter(Boolean).join(' / ')}`)
            } catch (_) {}
          }
          if (data.supplier_id) {
            setValue('supplier_id', data.supplier_id)
            // Preenche label visível da busca de fornecedor
            try {
              const { data: s } = await supabase
                .from('suppliers')
                .select('id, name, trade_name, corporate_name')
                .eq('id', data.supplier_id)
                .single()
              if (s) setSupplierQuery(s.trade_name ?? s.corporate_name ?? s.name ?? '')
            } catch (_) {}
          }
          setValue('notes', data.notes ?? '')

          // 4. Restaura Orçamento (topo)
          if (Array.isArray(data.budgetAttachments)) {
            setBudget(data.budgetAttachments as any)
            budgetRef.current = data.budgetAttachments as any
          }

          // 5. Restaura Fotos (Passo 3)
          if (Array.isArray(data.media)) {
            try {
              const withUrls = await getChecklistMediaUrls(data.media as any)
              setMedia(withUrls)
            } catch (e) {
              console.error('Erro ao carregar fotos do checklist:', e)
            }
          }

          // 6. Restaura fotos de combustível (entrada/saída)
          if (data.fuelGaugePhotos) {
            try {
              if (data.fuelGaugePhotos.entry?.path) {
                setFuelEntry(data.fuelGaugePhotos.entry)
                const { data: u } = await supabase.storage.from('checklists').createSignedUrl(data.fuelGaugePhotos.entry.path, 3600)
                setFuelEntryUrl(u?.signedUrl ?? null)
              } else {
                setFuelEntry(null)
                setFuelEntryUrl(null)
              }
              if (data.fuelGaugePhotos.exit?.path) {
                setFuelExit(data.fuelGaugePhotos.exit)
                const { data: u2 } = await supabase.storage.from('checklists').createSignedUrl(data.fuelGaugePhotos.exit.path, 3600)
                setFuelExitUrl(u2?.signedUrl ?? null)
              } else {
                setFuelExit(null)
                setFuelExitUrl(null)
              }
            } catch (e) {
              console.error('Erro ao carregar fotos de combustível:', e)
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar checklist:', error)
        toast.error('Erro ao carregar dados do rascunho.')
      } finally {
        setLoading(false)
      }
    }

    loadChecklist()
  }, [id, setValue])

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
      meta: { service: values.service, km: values.km, responsavel: values.responsavel, plate: values.plate, defects_note: items.meta.defects_note },
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

  async function onPickFuel(kind: 'entry' | 'exit', e: React.ChangeEvent<HTMLInputElement>) {
    try {
      if (!checklistId) return
      const file = e.target.files?.[0]
      if (!file) return
      let uploadFile: File = file
      const isImage = file.type.startsWith('image/')
      if (isImage) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
        try { uploadFile = (await imageCompression(file, options)) as File } catch {}
      }
      const ext = isImage
        ? (uploadFile.type === 'image/png' ? 'png' : uploadFile.type === 'image/webp' ? 'webp' : 'jpg')
        : (file.name.split('.').pop()?.toLowerCase() || 'bin')
      const path = `${checklistId}/fuel/${kind}-${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('checklists').upload(path, uploadFile, { upsert: false })
      if (upErr) throw new Error(upErr.message)
  
      const next = {
        entry: kind === 'entry' ? { path, created_at: new Date().toISOString() } : fuelEntry,
        exit: kind === 'exit' ? { path, created_at: new Date().toISOString() } : fuelExit,
      }
      const { error } = await supabase.from('checklists').update({ fuelGaugePhotos: next }).eq('id', checklistId)
      if (error) throw error
  
      if (kind === 'entry') {
        setFuelEntry(next.entry as any)
        const { data: u } = await supabase.storage.from('checklists').createSignedUrl(path, 3600)
        if (u) setFuelEntryUrl(u.signedUrl)
      } else {
        setFuelExit(next.exit as any)
        const { data: u } = await supabase.storage.from('checklists').createSignedUrl(path, 3600)
        if (u) setFuelExitUrl(u.signedUrl)
      }
      toast.success('Foto de combustível anexada')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao anexar combustível')
    }
  }

  async function saveDraft(silent: boolean = false) {
    try {
      if (!checklistId) return
      if (isSavingRef) isSavingRef.current = true
      setLoading(true)

      const currentItems = itemsRef.current || items
      const currentBudget = budgetRef.current || budget
      const formValues = getValues()

      // Buscar itens mais recentes para não sobrescrever defeitos salvos no Passo 2
      const { data: existing } = await supabase
        .from('checklists')
        .select('items')
        .eq('id', checklistId)
        .single()

      // Constrói metadados dos arquivos selecionados (sem binários)
      const budgetMeta = (Array.isArray(currentBudget) ? currentBudget : []).map((f: any) => ({
        name: f?.name,
        size: f?.size,
        type: f?.type,
      }))

      // Mescla itens preservando defeitos existentes e atualiza metadados do Passo 1
      const existingItems: any = (existing?.items ?? {})
      const mergedItems = {
        ...existingItems,
        ...currentItems,
        defects: Array.isArray(existingItems?.defects) ? existingItems.defects : currentItems?.defects,
        meta: {
          ...(existingItems?.meta ?? {}),
          ...(currentItems?.meta ?? {}),
          km: formValues.km ? Number(formValues.km) : (existingItems?.meta?.km ?? currentItems?.meta?.km),
          service: formValues.service || (existingItems?.meta?.service ?? currentItems?.meta?.service),
          responsavel: formValues.responsavel || (existingItems?.meta?.responsavel ?? currentItems?.meta?.responsavel),
          plate: formValues.plate || (existingItems?.meta?.plate ?? currentItems?.meta?.plate),
          defects_note: (existingItems?.meta?.defects_note ?? currentItems?.meta?.defects_note) || null,
        },
      }

      // Salva como RASCUNHO, guardando anexos no campo de topo e metadados do checklist
      const { error } = await supabase
        .from('checklists')
        .update({
          items: mergedItems,
          budgetAttachments: budgetMeta,
          vehicle_id: formValues.vehicle_id || null,
          supplier_id: formValues.supplier_id || null,
          notes: formValues.notes ?? (null as any),
          status: 'rascunho',
          is_locked: false,
        })
        .eq('id', checklistId)

      if (error) throw error

      toast.success('Rascunho salvo com sucesso!')
      if (!silent) navigate('/checklists')
    } catch (error: any) {
      console.error('Erro rascunho:', error)
      toast.error('Erro ao salvar: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
      setTimeout(() => { if (isSavingRef) isSavingRef.current = false }, 1000)
    }
  }

  async function saveDraftAndExit() {
    try {
      isSavingRef.current = true
      await saveDraft(true)
      navigate('/checklists')
    } finally {
      isSavingRef.current = false
    }
  }

  // Auto-save: tenta salvar rascunho quando usuário sai da rota ou fecha a aba
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSavingRef.current) return
      // Se tiver id, tenta salvar rascunho ao sair
      if (checklistId && !isFinalizingRef.current) {
        // Evita prompt, mas alguns navegadores exigem uma string
        e.preventDefault()
        e.returnValue = ""
        saveDraft(true)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [checklistId])

  // Auto-save ao desmontar (sair da tela)
  useEffect(() => {
    return () => {
      if (checklistId && !isFinalizingRef.current) {
        void saveDraft(true)
      }
    }
  }, [checklistId])

  async function saveAndExit() {
    // Bloqueia auto-save imediatamente
    if (isFinalizingRef) isFinalizingRef.current = true

    try {
      if (!checklistId) return
      setLoading(true)

      const currentItems = itemsRef.current || items
      const currentBudget = budgetRef.current || budget
      const formValues = getValues()

      // Buscar o estado mais recente salvo (preserva defeitos gravados no passo 2)
      const { data: existing } = await supabase
        .from('checklists')
        .select('items')
        .eq('id', checklistId)
        .single()

      // Extrai apenas metadados locais e prepara upload para storage
      const filesArray: any[] = Array.isArray(currentBudget) ? currentBudget : []
      const uploadedBudget = [] as { path: string; name?: string; size?: number; type?: string; created_at: string }[]
      for (const f of filesArray) {
        if (f && typeof f === 'object' && 'name' in f && f instanceof File) {
          const path = `budget/${checklistId}/${Date.now()}-${f.name}`
          const { error: upErr } = await supabase.storage.from('checklists').upload(path, f, { upsert: false })
          if (!upErr) uploadedBudget.push({ path, name: f.name, size: f.size, type: f.type, created_at: new Date().toISOString() })
        } else if (f?.path) {
          uploadedBudget.push({ path: f.path, name: f.name, size: f.size, type: f.type, created_at: f.created_at || new Date().toISOString() })
        }
      }

      // Mescla itens preservando defeitos existentes e atualiza metadados
      const existingItems: any = (existing?.items ?? {})
      const mergedItems = {
        ...existingItems,
        ...currentItems,
        defects: Array.isArray(existingItems?.defects) ? existingItems.defects : currentItems?.defects,
        meta: {
          ...(existingItems?.meta ?? {}),
          ...(currentItems?.meta ?? {}),
          km: formValues.km ? Number(formValues.km) : (existingItems?.meta?.km ?? currentItems?.meta?.km),
          service: formValues.service || (existingItems?.meta?.service ?? currentItems?.meta?.service),
          responsavel: formValues.responsavel || (existingItems?.meta?.responsavel ?? currentItems?.meta?.responsavel),
        },
      }

      const { error } = await supabase
        .from('checklists')
        .update({
          items: mergedItems,
          budgetAttachments: uploadedBudget,
          status: 'em_andamento',
          is_locked: false,
        })
        .eq('id', checklistId)

      if (error) throw error

      toast.success('Checklist salvo e colocado em andamento!')
      navigate('/checklists')
    } catch (error: any) {
      console.error('Erro ao finalizar:', error)
      toast.error('Erro ao salvar checklist.')
      if (isFinalizingRef) isFinalizingRef.current = false
    } finally {
      setLoading(false)
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
            <div className="flex justify-end gap-2 mb-16 md:mb-0">
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
            <div className="flex justify-between mb-16 md:mb-0">
              <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={advanceFromPhotos}>Avançar</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
            <div className="mb-6"><h2 className="text-2xl font-bold">Finalização</h2></div>
            
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="bg-muted/30 border-b p-4 flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Orçamento e Anexos</h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Área de Upload */}
                <div className="border-2 border-dashed border-muted-foreground/20 bg-muted/5 rounded-xl p-6 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  
                  {/* Contador Dinâmico */}
                  <p className="text-sm font-medium mb-4">
                    {(budget && budget.length > 0)
                      ? <span className="text-green-500 font-bold">{budget.length} arquivo(s) pronto(s) para salvar</span>
                      : "Nenhum arquivo selecionado"
                    }
                  </p>
                  
                  <input 
                    id="budget-upload" 
                    type="file" 
                    accept=".pdf,image/*" 
                    multiple 
                    className="hidden" 
                    onChange={(e) => { 
                      if (e.target.files && e.target.files.length > 0) { 
                        const newFiles = Array.from(e.target.files); 
                        setBudget((prev) => [...(prev || []), ...newFiles]);
                        setBudgetPendingFiles((prev) => [...prev, ...newFiles]);
                        e.target.value = ''; 
                      } 
                    }} 
                  />
                  <label 
                    htmlFor="budget-upload" 
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-6 py-2 transition-colors mb-4" 
                  > 
                    Escolher Arquivos 
                  </label>

                  {/* LISTA DE ARQUIVOS */}
                  {(budget || []).length > 0 && (
                    <div className="grid gap-3 mt-6 text-left">
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Arquivos na lista ({budget.length})</p>
                      
                      {budget.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl shadow-sm hover:border-primary/30 transition-all">
                          
                          {/* Ícone e Nome */}
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                              file.type?.includes('pdf')
                                ? 'bg-red-50 text-red-600 border-red-100'
                                : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {file.type?.includes('pdf') ? 'PDF' : 'IMG'}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="truncate text-sm font-medium text-foreground pr-2">{file.name}</span>
                              <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
                            </div>
                          </div>
                          
                          {/* BOTÃO EXCLUIR (Texto) */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors font-medium"
                            onClick={() => {
                              setBudget(prev => prev.filter((_, i) => i !== index));
                              setBudgetPendingFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 border border-border rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-3">Registro de Combustível</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">ENTRADA</div>
                        {fuelEntryUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFuelEntry(null)}
                            className="text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        )}
                      </div>
                      {fuelEntryUrl ? (
                        <img src={fuelEntryUrl} className="w-full h-48 object-cover rounded-md border" />
                      ) : (
                        <>
                          <input
                            id="fuel-entry"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onPickFuel('entry', e)}
                          />
                          <label
                            htmlFor="fuel-entry"
                            className="cursor-pointer border-2 border-dashed border-muted-foreground/25 rounded-lg h-48 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
                          >
                            <Camera className="w-5 h-5" />
                            <span className="font-medium">Anexar Entrada</span>
                          </label>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">SAÍDA</div>
                        {fuelExitUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFuelExit(null)}
                            className="text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        )}
                      </div>
                      {fuelExitUrl ? (
                        <img src={fuelExitUrl} className="w-full h-48 object-cover rounded-md border" />
                      ) : (
                        <>
                          <input
                            id="fuel-exit"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onPickFuel('exit', e)}
                          />
                          <label
                            htmlFor="fuel-exit"
                            className="cursor-pointer border-2 border-dashed border-muted-foreground/25 rounded-lg h-48 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
                          >
                            <Camera className="w-5 h-5" />
                            <span className="font-medium">Anexar Saída</span>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>


              </div> 
            </div> 

            {/* Footer de Ações (Únicos botões de salvar) */} 
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8 pt-4 border-t"> 
              <Button variant="ghost" onClick={() => setStep(3)}>Voltar</Button> 
              <div className="flex gap-2 w-full sm:w-auto"> 
                <Button variant="secondary" onClick={() => saveDraft()} className="flex-1 sm:flex-none"> 
                  <Save className="w-4 h-4 mr-2"/>Rascunho 
                </Button> 
                <Button onClick={saveAndExit} disabled={finalizing || isLocked} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"> 
                    {finalizing ? 'Salvando...' : <><CheckCircle2 className="w-4 h-4 mr-2"/>Finalizar</>} 
                </Button> 
              </div> 
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
