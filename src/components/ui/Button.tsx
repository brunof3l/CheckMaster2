import { cn } from '@/utils/cn'
import { ButtonHTMLAttributes } from 'react'
import Spinner from './Spinner'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
  loading?: boolean
}

export default function Button({ className, variant = 'primary', loading, children, ...props }: Props) {
  const styles =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-[1px]'
      : 'bg-transparent hover:bg-muted border border-border hover:-translate-y-[1px]'

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-transform duration-150 active:scale-95 will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/50 disabled:opacity-60 disabled:cursor-not-allowed',
        styles,
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
