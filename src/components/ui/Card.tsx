import { cn } from '@/utils/cn'

export default function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-lg bg-card border border-border shadow-soft', className)}>{children}</div>
}

