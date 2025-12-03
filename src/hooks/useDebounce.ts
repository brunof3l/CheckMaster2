import { useEffect, useRef } from 'react'

export function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  const t = useRef<number | undefined>(undefined)
  return (...args: Parameters<T>) => {
    if (t.current) window.clearTimeout(t.current)
    t.current = window.setTimeout(() => fn(...args), delay)
  }
}

