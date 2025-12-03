import { supabase } from '@/config/supabase'

export type ChecklistMediaItem = {
  type: 'photo'
  path: string
  created_at: string
}

export type ChecklistMediaItemWithUrl = ChecklistMediaItem & { url: string | null }

const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

function getExt(file: File) {
  const m = file.type
  if (m === 'image/jpeg') return 'jpg'
  if (m === 'image/png') return 'png'
  if (m === 'image/webp') return 'webp'
  if (m === 'image/heic') return 'heic'
  if (m === 'image/heif') return 'heif'
  const name = file.name.toLowerCase()
  const match = name.match(/\.(jpg|jpeg|png|webp|heic|heif)$/)
  return match ? match[1] : 'jpg'
}

export async function uploadChecklistMedia(
  checklistId: string,
  files: File[],
  existing?: ChecklistMediaItem[]
): Promise<ChecklistMediaItem[]> {
  const images = files.filter((f) => allowed.includes(f.type) || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(f.name))
  if (images.length === 0) return existing ?? []
  const nextMedia: ChecklistMediaItem[] = [...(existing ?? [])]
  for (const f of images) {
    const ext = getExt(f)
    const path = `${checklistId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('checklists').upload(path, f, { upsert: false })
    if (error) throw new Error(`Upload falhou: ${error.message}`)
    nextMedia.push({ type: 'photo', path, created_at: new Date().toISOString() })
  }
  const { error: updError } = await supabase.from('checklists').update({ media: nextMedia }).eq('id', checklistId)
  if (updError) throw new Error(`Erro ao atualizar checklist: ${updError.message}`)
  return nextMedia
}

export async function getChecklistMediaUrls(items: ChecklistMediaItem[]): Promise<ChecklistMediaItemWithUrl[]> {
  const out: ChecklistMediaItemWithUrl[] = []
  for (const it of items) {
    const { data, error } = await supabase.storage.from('checklists').createSignedUrl(it.path, 3600)
    if (error) out.push({ ...it, url: null })
    else out.push({ ...it, url: data.signedUrl })
  }
  return out
}

