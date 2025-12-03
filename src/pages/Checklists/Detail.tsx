import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import { useParams } from 'react-router-dom'
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

  const { data, isLoading, update, finalize } = useChecklistDetail(id!)

  useEffect(() => {
    setNotes(data?.notes ?? '')
  }, [data?.notes])

  useEffect(() => {
    ;(async () => {
      const items = (data?.media ?? []) as ChecklistMediaItem[]
      const urls = await getChecklistMediaUrls(items)
      setMedia(urls)
      const atts = (data?.budgetAttachments ?? []) as { path: string; name?: string; size?: number; type?: string; created_at: string }[]
      const out: { path: string; name?: string; size?: number; type?: string; created_at: string; url: string | null }[] = []
      for (const a of atts) {
        const { data: u, error } = await supabase.storage.from('checklists').createSignedUrl(a.path, 3600)
        out.push({ ...a, url: error ? null : u.signedUrl })
      }
      setBudget(out)
      const entry = (data?.fuelGaugePhotos?.entry ?? null) as { path: string } | null
      const exit = (data?.fuelGaugePhotos?.exit ?? null) as { path: string } | null
      if (entry) {
        const { data: u, error } = await supabase.storage.from('checklists').createSignedUrl(entry.path, 3600)
        setFuelEntryUrl(error ? null : u.signedUrl)
      } else setFuelEntryUrl(null)
      if (exit) {
        const { data: u, error } = await supabase.storage.from('checklists').createSignedUrl(exit.path, 3600)
        setFuelExitUrl(error ? null : u.signedUrl)
      } else setFuelExitUrl(null)
    })()
  }, [data?.media])

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
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Placa</span>
                  <div>{data?.vehicles?.plate ?? '-'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Fornecedor</span>
                  <div>{data?.suppliers?.trade_name ?? data?.suppliers?.corporate_name ?? '-'}</div>
                </div>
              </div>
            </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-3">Combustível</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Entrada</div>
                {fuelEntryUrl ? (
                  <img src={fuelEntryUrl} className="w-full h-32 object-cover rounded-md" />
                ) : (
                  <div className="text-xs text-muted-foreground">Sem foto</div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Saída</div>
                {fuelExitUrl ? (
                  <img src={fuelExitUrl} className="w-full h-32 object-cover rounded-md" />
                ) : (
                  <div className="text-xs text-muted-foreground">Sem foto</div>
                )}
              </div>
            </div>
          </Card>
          </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Fotos</h2>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={data?.is_locked || data?.status === 'finalizado'}
          />
          <Button variant="ghost" onClick={() => setOpen(true)}>
            Abrir galeria
          </Button>
          <Button
            onClick={handleSaveFiles}
            loading={saving}
            disabled={saving || pendingFiles.length === 0 || data?.is_locked || data?.status === 'finalizado'}
          >
            Salvar alterações
          </Button>
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
            {Array.isArray((data?.items as any)?.defects) ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {((data?.items as any).defects as { key: string; label: string; ok: boolean }[]).map((d) => (
                  <div key={d.key} className={"px-2 py-1 rounded-md border " + (d.ok ? "border-green-700/60 bg-green-500/10 text-green-300" : "border-red-700/60 bg-red-500/10 text-red-300")}>{d.label}</div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Sem dados</p>
            )}
            {((data?.items as any)?.meta?.defects_note ?? '') ? (
              <div className="mt-2 text-xs text-muted-foreground">{(data?.items as any).meta.defects_note}</div>
            ) : null}
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
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground text-sm">Total</span>
                <div className="text-sm">{(data?.items as any)?.meta?.budget_total ?? '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Notas</span>
                <div className="text-sm">{(data?.items as any)?.meta?.budget_notes ?? '-'}</div>
              </div>
            </div>
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
          <div className="flex gap-2">
            <Button onClick={() => finalize.mutate(undefined, { onError: (e: any) => toast.error(e.message) })}>
              Finalizar checklist
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
