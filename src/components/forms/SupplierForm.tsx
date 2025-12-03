import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useEffect, useRef, useState } from 'react'
import type { Supplier } from '@/types'
import { toast } from 'sonner'

export type SupplierFormValues = {
  cnpj: string
  corporate_name: string
  trade_name: string
  address: string
  phone: string
  email: string
  contact_name: string
  notes: string
}

function onlyDigits(v: string) {
  return v.replace(/\D+/g, '')
}

function formatCNPJ(v: string) {
  const digits = onlyDigits(v).slice(0, 14)
  let out = ''
  if (digits.length > 0) out = digits.slice(0, 2)
  if (digits.length >= 3) out += '.' + digits.slice(2, 5)
  if (digits.length >= 6) out += '.' + digits.slice(5, 8)
  if (digits.length >= 9) out += '/' + digits.slice(8, 12)
  if (digits.length >= 13) out += '-' + digits.slice(12, 14)
  return out
}

export default function SupplierForm({ initial, onCancel, onSave, loading }: { initial?: Partial<Supplier> | SupplierFormValues; onCancel: () => void; onSave: (values: SupplierFormValues) => Promise<void> | void; loading?: boolean }) {
  const [cnpj, setCnpj] = useState(formatCNPJ((initial?.cnpj as string) ?? ''))
  const [corporateName, setCorporateName] = useState((initial?.corporate_name as string) ?? '')
  const [tradeName, setTradeName] = useState((initial?.trade_name as string) ?? '')
  const [address, setAddress] = useState((initial?.address as string) ?? '')
  const [phone, setPhone] = useState((initial?.phone as string) ?? '')
  const [email, setEmail] = useState((initial?.email as string) ?? '')
  const [contactName, setContactName] = useState((initial?.contact_name as string) ?? '')
  const [notes, setNotes] = useState((initial?.notes as string) ?? '')
  const lastFetchedCnpj = useRef<string>('')
  const [fetchingCnpj, setFetchingCnpj] = useState(false)
  const [saving, setSaving] = useState(false)

  function setValue(name: keyof SupplierFormValues, value: string) {
    if (name === 'phone') setPhone(value)
  }

  function composePhone(ddd?: string | number, tel?: string | number) {
    const d = (ddd ?? '').toString().trim()
    const t = (tel ?? '').toString().trim()
    if (!d || !t) return ''
    return `(${d}) ${t}`
  }

  function formatBrazilianPhone(raw: string): string {
    if (!raw) return ''
    const digits = raw.replace(/\D/g, '')
    const first = digits.slice(0, 11)
    const d = first.length <= 10 ? first : first.slice(0, 11)
    if (d.length < 10) return raw
    const ddd = d.slice(0, 2)
    const num = d.slice(2)
    if (num.length === 8) return `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`
    if (num.length === 9) return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`
    return `(${ddd}) ${num}`
  }

  function extractPhoneFromCnpjResponse(data: any): string {
    if (!data || typeof data !== 'object') return ''
    const direct1 = composePhone((data as any).ddd_telefone_1, (data as any).telefone_1)
    if (direct1) return direct1
    const direct2 = composePhone((data as any).dddTelefone1, (data as any).telefone1 ?? (data as any).telefone)
    if (direct2) return direct2
    const direct3 = composePhone((data as any).ddd, (data as any).telefone)
    if (direct3) return direct3
    const est1 = composePhone((data as any)?.estabelecimento?.ddd1, (data as any)?.estabelecimento?.telefone1)
    if (est1) return est1
    const est2 = composePhone((data as any)?.estabelecimento?.ddd2, (data as any)?.estabelecimento?.telefone2)
    if (est2) return est2
    const simpleTop = ((data as any).telefone ?? (data as any)?.estabelecimento?.telefone1 ?? '').toString().trim()
    if (simpleTop) return simpleTop
    function findPhoneRecursive(obj: any): string {
      if (!obj) return ''
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const r = findPhoneRecursive(item)
          if (r) return r
        }
        return ''
      }
      if (typeof obj === 'object') {
        const entries = Object.entries(obj) as [string, any][]
        const phoneEntry = entries.find(([key, value]) => {
          const k = key.toLowerCase()
          return (k.includes('telefone') || k.includes('phone')) && typeof value === 'string' && value.trim().length > 0
        })
        if (phoneEntry) {
          const dddEntry = entries.find(([key, value]) => key.toLowerCase().includes('ddd') && typeof value !== 'object')
          if (dddEntry) return composePhone(dddEntry[1], phoneEntry[1]) || String(phoneEntry[1])
          return String(phoneEntry[1])
        }
        for (const [, value] of entries) {
          const r = findPhoneRecursive(value)
          if (r) return r
        }
      }
      return ''
    }
    return findPhoneRecursive(data)
  }

  async function fetchCnpjData(digitsCnpj: string) {
    try {
      setFetchingCnpj(true)
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitsCnpj}`)
      if (!res.ok) throw new Error('CNPJ não encontrado')
      const data = await res.json()
      // console.log('CNPJ API response', data)
      setCorporateName(data.razao_social ?? corporateName)
      setTradeName(data.nome_fantasia ?? tradeName)
      const rawPhone = extractPhoneFromCnpjResponse(data)
      const formattedPhone = rawPhone ? formatBrazilianPhone(rawPhone) : ''
      if (formattedPhone) setValue('phone', formattedPhone)
      const addrParts = [
        data.logradouro,
        data.numero,
        data.bairro,
        data.municipio,
        data.uf,
        data.cep ? `CEP ${data.cep}` : undefined,
      ].filter(Boolean)
      setAddress(addrParts.join(', '))
      lastFetchedCnpj.current = digitsCnpj
      toast.success('Dados do CNPJ preenchidos automaticamente')
    } catch (e: any) {
      toast.error(e.message ?? 'Falha ao buscar CNPJ')
    } finally {
      setFetchingCnpj(false)
    }
  }

  useEffect(() => {
    const digits = onlyDigits(cnpj)
    if (digits.length === 14 && digits !== lastFetchedCnpj.current) {
      fetchCnpjData(digits)
    }
  }, [cnpj])

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        const digits = onlyDigits(cnpj)
        if (digits.length !== 14) {
          toast.error('CNPJ é obrigatório e deve ter 14 dígitos')
          setSaving(false)
          return
        }
        if (!corporateName.trim()) {
          toast.error('Razão Social é obrigatória')
          setSaving(false)
          return
        }
        try {
          await onSave({
            cnpj: digits,
            corporate_name: corporateName.trim(),
            trade_name: tradeName.trim(),
            address: address.trim(),
            phone: phone.trim(),
            email: email.trim(),
            contact_name: contactName.trim(),
            notes: notes.trim(),
          })
        } catch (err: any) {
          console.error('Erro inesperado ao salvar fornecedor:', err)
          toast.error(String(err?.message ?? err) || 'Erro inesperado ao salvar fornecedor')
        } finally {
          setSaving(false)
        }
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          placeholder="CNPJ"
          value={cnpj}
          onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
          onBlur={() => {
            const digits = onlyDigits(cnpj)
            if (digits.length === 14 && digits !== lastFetchedCnpj.current) fetchCnpjData(digits)
          }}
        />
        <Input placeholder="Razão Social" value={corporateName} onChange={(e) => setCorporateName(e.target.value)} />
        <Input placeholder="Nome Fantasia" value={tradeName} onChange={(e) => setTradeName(e.target.value)} />
        <Input placeholder="Endereço" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Responsável" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        <textarea
          className="w-full rounded-md bg-muted border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          rows={4}
          placeholder="Observações"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving || !!loading || fetchingCnpj}>Salvar</Button>
      </div>
    </form>
  )
}
