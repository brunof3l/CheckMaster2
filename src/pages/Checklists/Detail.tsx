import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import { useParams, useNavigate } from 'react-router-dom'
import { useChecklistDetail } from '@/hooks/useChecklists'
import Input from '@/components/ui/Input'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import SimpleModal from '@/components/ui/SimpleModal'
import { ChecklistMediaItem, ChecklistMediaItemWithUrl, uploadChecklistMedia, getChecklistMediaUrls } from '@/services/checklistMedia'
import { supabase } from '@/config/supabase'

type LocalChecklist = any

export default function ChecklistDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [notes, setNotes] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [media, setMedia] = useState<ChecklistMediaItemWithUrl[]>([])
  const [selected, setSelected] = useState<ChecklistMediaItemWithUrl | null>(null)
  const [budget, setBudget] = useState<{ path: string; name?: string; size?: number; type?: string; created_at: string; url: string | null }[]>([])
  const [fuelEntryUrl, setFuelEntryUrl] = useState<string | null>(null)
  const [fuelExitUrl, setFuelExitUrl] = useState<string | null>(null)
  const [viewImage, setViewImage] = useState<string | null>(null)

  const { data, isLoading, update, finalize } = useChecklistDetail(id!)
  const meta = (data?.items as any)?.meta || {}

  useEffect(() => {
    setNotes(data?.notes ?? '')
  }, [data?.notes])

  useEffect(() => {
    if (!data) return
    const loadUrls = async () => {
      // 1. Fotos Gerais (Media)
      if (data.media && Array.isArray(data.media)) {
        const urls = await getChecklistMediaUrls(data.media as ChecklistMediaItem[])
        setMedia(urls)
      }

      // 2. Orçamento (Budget)
      if (data.budgetAttachments && Array.isArray(data.budgetAttachments)) {
        const budgetWithUrls = await Promise.all(
          (data.budgetAttachments as any[]).map(async (item: any) => {
            const { data: u } = await supabase.storage.from('checklists').createSignedUrl(item.path, 3600)
            return { ...item, url: u?.signedUrl || null }
          })
        )
        setBudget(budgetWithUrls)
      }

      // 3. Combustível (Fuel)
      if (data.fuelGaugePhotos) {
        if (data.fuelGaugePhotos.entry?.path) {
          const { data: u } = await supabase.storage.from('checklists').createSignedUrl(data.fuelGaugePhotos.entry.path, 3600)
          if (u) setFuelEntryUrl(u.signedUrl)
        } else {
          setFuelEntryUrl(null)
        }
        if (data.fuelGaugePhotos.exit?.path) {
          const { data: u } = await supabase.storage.from('checklists').createSignedUrl(data.fuelGaugePhotos.exit.path, 3600)
          if (u) setFuelExitUrl(u.signedUrl)
        } else {
          setFuelExitUrl(null)
        }
      }
    }
    loadUrls()
  }, [data])

  function saveNotes(value: string) {
    update.mutate({ notes: value }, { onError: (e: any) => toast.error(e.message ?? 'Erro ao salvar notas') })
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (data && notes !== (data.notes ?? '')) saveNotes(notes)
    }, 600)
    return () => clearTimeout(t)
  }, [notes])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setPendingFiles((prev) => [...prev, ...files])
  }

  async function handleSaveFiles() {
    if (!id) return
    if (pendingFiles.length === 0) return
    try {
      setSaving(true)
      const updated = await uploadChecklistMedia(id, pendingFiles, media.map(({ url, ...rest }) => rest))
      const withUrls = await getChecklistMediaUrls(updated)
      setMedia(withUrls)
      setPendingFiles([])
      toast.success('Fotos enviadas')
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao enviar fotos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <HeaderPage title="Checklist" />
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Dados</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nº Checklist</span>
                  <div>{data?.seq ?? '-'}</div>
                </div>
                <div>
                   <span className="text-muted-foreground">Placa</span>
                   <div>{data?.vehicles?.plate ?? '-'}</div>
                 </div>
                <div>
                  <span className="text-muted-foreground">Modelo/Marca</span>
                  <div>{[data?.vehicles?.model, data?.vehicles?.brand].filter(Boolean).join(' / ') || '-'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Fornecedor</span>
                  <div>{data?.suppliers?.trade_name ?? data?.suppliers?.corporate_name ?? '-'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Serviço</span>
                  <div>{meta.service || '-'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">KM</span>
                  <div>{meta.km || '-'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Responsável</span>
                  <div>{meta.responsavel || '-'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Data de criação</span>
                  <div>{data?.created_at ? new Date(data.created_at).toLocaleString('pt-BR') : '-'}</div>
                </div>
              </div>
            </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-3">Combustível</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Entrada</div>
                {fuelEntryUrl ? (
                  <img
                    src={fuelEntryUrl}
                    className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setViewImage(fuelEntryUrl!)}
                  />
                ) : (
                  <div className="text-xs text-muted-foreground">Sem foto</div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Saída</div>
                {fuelExitUrl ? (
                  <img
                    src={fuelExitUrl}
                    className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setViewImage(fuelExitUrl!)}
                  />
                ) : (
                  <div className="text-xs text-muted-foreground">Sem foto</div>
                )}
              </div>
            </div>
          </Card>
          </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Fotos</h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mt-2">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={data?.is_locked || data?.status === 'finalizado'}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md flex items-center justify-center text-sm font-medium w-full md:w-auto"
            >
              Escolher arquivos
            </label>
          </div>

          <span className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-none">
            {pendingFiles.length > 0
              ? (pendingFiles.length === 1 ? pendingFiles[0].name : `${pendingFiles.length} arquivo(s) selecionado(s)`) 
              : 'Nenhum arquivo escolhido'}
          </span>

          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="ghost" className="flex-1 md:flex-none border border-border" onClick={() => setOpen(true)}>
              Abrir galeria
            </Button>
            <Button
              onClick={handleSaveFiles}
              loading={saving}
              disabled={saving || pendingFiles.length === 0 || data?.is_locked || data?.status === 'finalizado'}
              className="flex-1 md:flex-none"
            >
              {saving ? 'Enviando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
        {pendingFiles.length > 0 && (
          <div className="text-sm text-muted-foreground mt-2">{pendingFiles.length} arquivo(s) para enviar</div>
        )}
        {data?.is_locked || data?.status === 'finalizado' ? (
          <div className="text-sm text-amber-400 mt-2">Checklist finalizado. Não é possível anexar novas fotos.</div>
        ) : null}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {media.map((m) => (
            <button key={m.path} onClick={() => setSelected(m)}>
              <img src={m.url ?? ''} className="w-full h-24 object-cover rounded-md" />
            </button>
          ))}
        </div>
      </Card>

          <Card className="p-4">
             <h2 className="font-semibold mb-3">Itens com defeito</h2>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
               {((data?.items as any)?.defects ?? [])
                 .filter((d: any) => d.checked)
                 .map((d: any) => (
                   <div
                     key={d.key}
                     className="px-3 py-2 rounded-md border border-red-700/60 bg-red-500/10 text-red-300 font-medium"
                   >
                     {d.label}
                   </div>
                 ))}
               {((data?.items as any)?.defects ?? []).filter((d: any) => d.checked).length === 0 && (
                 <p className="text-muted-foreground text-sm col-span-full">Nenhum defeito apontado.</p>
               )}
             </div>
             {((data?.items as any)?.meta?.defects_note) && (
               <div className="mt-3 p-3 rounded-md bg-muted/30 border border-border">
                 <span className="text-xs text-muted-foreground uppercase font-bold block mb-1">Outros / Observações</span>
                 <div className="text-sm">{(data?.items as any).meta.defects_note}</div>
               </div>
             )}
           </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-3">Orçamento</h2>
            {budget.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sem anexos</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {budget.map((b) => (
                  <a key={b.path} href={b.url ?? '#'} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md border border-border hover:bg-border/40 text-sm">
                    <div className="font-medium">{b.name ?? b.path.split('/').pop()}</div>
                    <div className="text-xs text-muted-foreground">{b.type ?? ''} {b.size ? `• ${(b.size / 1024).toFixed(1)} KB` : ''}</div>
                  </a>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-2">Notas</h2>
            <textarea
              className="w-full min-h-28 rounded-md bg-muted border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="mt-2 text-xs text-muted-foreground">Auto-save com debounce</div>
          </Card>

          <SimpleModal open={open} onClose={() => setOpen(false)} title="Galeria">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {media.map((m) => (
                <div key={m.path} className="relative">
                  <img src={m.url ?? ''} className="rounded-md" />
                </div>
              ))}
            </div>
          </SimpleModal>
          <SimpleModal open={!!selected} onClose={() => setSelected(null)} title="Prévia da imagem">
            {selected && <img src={selected.url ?? ''} className="w-full h-auto rounded-md" />}
          </SimpleModal>
          <SimpleModal open={!!viewImage} onClose={() => setViewImage(null)} title="Visualização">
            {viewImage && <img src={viewImage} className="w-full h-auto rounded-md" />}
          </SimpleModal>
          <div className="flex gap-2 mt-6">
            {data?.status === 'finalizado' || data?.is_locked ? (
              <Button onClick={() => navigate('/checklists')}>
                Voltar
              </Button>
            ) : (
              <Button onClick={() => finalize.mutate(undefined, {
                onSuccess: () => {
                  toast.success('Checklist finalizado com sucesso!')
                  navigate('/checklists')
                },
                onError: (e: any) => toast.error(e.message || 'Erro ao finalizar')
              })}>
                Finalizar checklist
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
