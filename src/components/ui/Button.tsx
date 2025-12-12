import { cn } from '@/utils/cn'
import { ButtonHTMLAttributes } from 'react'
import Spinner from './Spinner'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
}

export default function Button({
  className,
  variant = 'primary',
  size = 'default',
  loading,
  children,
  ...props
}: ButtonProps) {
  const variantStyles =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-[1px]'
      : variant === 'ghost'
      ? 'bg-transparent hover:bg-muted border border-border hover:-translate-y-[1px]'
      : variant === 'outline'
      ? 'bg-transparent border border-border text-foreground hover:bg-muted'
      : variant === 'secondary'
      ? 'bg-muted text-foreground hover:bg-muted/80'
      : variant === 'destructive'
      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      : 'bg-transparent text-primary hover:underline'; // link

  const sizeStyles =
    size === 'sm'
      ? 'h-9 px-3 text-xs'
      : size === 'lg'
      ? 'h-11 px-8 text-base'
      : size === 'icon'
      ? 'h-10 w-10'
      : 'h-10 px-4 py-2 text-sm'

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md transition-transform duration-150 active:scale-95 will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/50 disabled:opacity-60 disabled:cursor-not-allowed',
        sizeStyles,
        variantStyles,
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
