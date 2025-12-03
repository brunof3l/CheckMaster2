import * as Dialog from '@radix-ui/react-dialog'

export function Modal({ open, onOpenChange, children }: { open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  )
}

export function ModalTrigger({ children }: { children: React.ReactNode }) {
  return <Dialog.Trigger asChild>{children}</Dialog.Trigger>
}

export function ModalContent({ children }: { children: React.ReactNode }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/60" />
      <Dialog.Content className="fixed inset-0 m-auto w-full max-w-2xl rounded-lg bg-card p-4 border border-border">
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

