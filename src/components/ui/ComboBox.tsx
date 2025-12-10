import { Combobox, Transition } from '@headlessui/react'
import { Fragment, useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

type Item = { id: string; label: string; value?: any }

export default function ComboBox({ value, onChange, items = [], placeholder }: {
  value: Item | null
  onChange: (val: Item) => void
  items: Item[]
  placeholder?: string
}) {
  const [rawQuery, setRawQuery] = useState('')
  const [query, setQuery] = useState('')
  const setQueryDebounced = useDebounce((v: string) => setQuery(v), 300)
  const filtered = useMemo(() => (query === '' ? items : items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))), [items, query])

  return (
    <Combobox value={value as any} onChange={(v) => { onChange(v as any); setRawQuery(''); setQuery('') }} nullable>
      <div className="relative">
        <Combobox.Input className="w-full rounded-md px-3 py-2 bg-muted border border-border text-sm" displayValue={(item: Item) => item?.label ?? ''} onChange={(e) => { setRawQuery(e.target.value); setQueryDebounced(e.target.value) }} placeholder={placeholder} />
        <Transition as={Fragment} enter="transition ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="transition ease-in duration-120" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
          <Combobox.Options className="absolute z-[70] w-full mt-2 bg-card rounded-md shadow-lg max-h-56 overflow-auto border border-border will-change-transform origin-top">
            {filtered.length === 0 && <div className="p-2 text-sm text-muted-foreground">Nenhum resultado</div>}
            {filtered.map(item => (
              <Combobox.Option
                key={item.id}
                value={item}
                className={({ active, selected }) => `px-3 py-2 cursor-pointer text-sm transition-transform ${active ? 'bg-primary/10 scale-[0.99]' : ''} ${selected ? 'bg-primary/15' : ''}`}
              >
                {item.label}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  )
}