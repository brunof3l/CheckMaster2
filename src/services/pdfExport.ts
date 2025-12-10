import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getChecklistById } from '@/services/checklists'
import { supabase } from '@/config/supabase'

async function pathToDataUrl(path: string): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  const { data, error } = await supabase.storage.from('checklists').createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) return null
  const resp = await fetch(data.signedUrl)
  if (!resp.ok) return null
  const blob = await resp.blob()
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
  const format: 'PNG' | 'JPEG' = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
  return { dataUrl, format }
}

export async function exportChecklistPDF(checklistId: string): Promise<void> {
  const checklist = await getChecklistById(checklistId)
  if (!checklist) throw new Error('Checklist não encontrado')

  const doc = new jsPDF()
  const margin = 14
  let y = 20

  doc.setFontSize(16)
  doc.text('Relatório de Checklist', margin, y)
  y += 8
  doc.setFontSize(10)
  const seq = (checklist as any)?.seq ?? null
  const seqText = seq ? `CHECK-${String(seq).padStart(6, '0')}` : 'CHECK-—'
  doc.text(seqText, margin, y)
  doc.text(new Date().toLocaleString('pt-BR'), doc.internal.pageSize.getWidth() - margin, y, { align: 'right' })
  y += 10

  const meta = ((checklist as any)?.items?.meta ?? {}) as any
  const km = meta.km ?? '-'
  const responsavel = meta.responsavel ?? '-'
  const dataAbertura = (checklist as any)?.created_at ? new Date((checklist as any).created_at).toLocaleString('pt-BR') : '-'

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 9 },
    head: [['Campo', 'Valor']],
    body: [
      ['Placa', (checklist as any)?.vehicles?.plate ?? '-'],
      ['Fornecedor', (checklist as any)?.suppliers?.trade_name ?? (checklist as any)?.suppliers?.corporate_name ?? '-'],
      ['KM', String(km)],
      ['Responsável', String(responsavel)],
      ['Data de Abertura', String(dataAbertura)],
      ['Veículo', [
        (checklist as any)?.vehicles?.brand,
        (checklist as any)?.vehicles?.model,
        (checklist as any)?.vehicles?.year,
      ].filter(Boolean).join(' / ') || '-'],
    ],
  })
  y = (doc as any).lastAutoTable.finalY + 8

  const defects = Array.isArray((checklist as any)?.items?.defects)
    ? (((checklist as any).items.defects as any[]) || []).filter((d) => !!d.checked && !!d.problem)
    : []

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 9 },
    head: [['Defeito', 'Observações']],
    body: defects.map((d) => [d.label ?? '-', d.notes ?? '']),
  })
  y = (doc as any).lastAutoTable.finalY + 8

  const notes = (checklist as any)?.notes ?? ''
  if (String(notes).trim().length > 0) {
    doc.setFontSize(12)
    doc.text('Observações', margin, y)
    y += 6
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(String(notes), doc.internal.pageSize.getWidth() - margin * 2)
    doc.text(lines, margin, y)
    y += (Array.isArray(lines) ? lines.length : 1) * 5 + 6
  }

  // Seção de Orçamento: exibir imagem dos anexos de orçamento e remover Total/Notas
  doc.setFontSize(12)
  doc.text('Orçamento', margin, y)
  y += 6
  const budgetAtts = (((checklist as any)?.budgetAttachments ?? []) as { path: string; type?: string }[])
  const budgetImages = budgetAtts
    .filter((a) => (a.type ?? '').startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(a.path))
    .map((a) => a.path)

  if (budgetImages.length === 0) {
    doc.setFontSize(10)
    doc.text('Sem anexos', margin, y)
    y += 6
  } else {
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const gap = 6
    const cols = 2
    const imgW = (pageW - margin * 2 - gap) / cols
    const imgH = 60
    let col = 0
    for (const p of budgetImages) {
      const img = await pathToDataUrl(p)
      if (!img) continue
      const x = margin + col * (imgW + gap)
      if (y + imgH > pageH - margin) {
        doc.addPage()
        y = margin
      }
      doc.addImage(img.dataUrl, img.format, x, y, imgW, imgH)
      col++
      if (col >= cols) {
        col = 0
        y += imgH + gap
      }
    }
    y += 2
  }

  // Outras imagens e anexos (exceto orçamento) em "Anexos"
  const imagePaths: string[] = []
  const media = (((checklist as any)?.media ?? []) as { path: string }[])
  for (const m of media) imagePaths.push(m.path)
  const fuel = (checklist as any)?.fuelGaugePhotos ?? {}
  if (fuel?.entry?.path) imagePaths.push(fuel.entry.path)
  if (fuel?.exit?.path) imagePaths.push(fuel.exit.path)

  if (imagePaths.length > 0) {
    doc.setFontSize(12)
    doc.text('Anexos', margin, y)
    y += 6
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const gap = 6
    const cols = 2
    const imgW = (pageW - margin * 2 - gap) / cols
    const imgH = 60
    let col = 0
    for (const p of imagePaths) {
      const img = await pathToDataUrl(p)
      if (!img) continue
      const x = margin + col * (imgW + gap)
      if (y + imgH > pageH - margin) {
        doc.addPage()
        y = margin
      }
      doc.addImage(img.dataUrl, img.format, x, y, imgW, imgH)
      col++
      if (col >= cols) {
        col = 0
        y += imgH + gap
      }
    }
  }

  const filename = `checklist-${(checklist as any)?.vehicles?.plate ?? 'sem-placa'}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}