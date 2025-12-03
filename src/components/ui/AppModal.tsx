import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

type Props = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  title?: string
  description?: string
  children: React.ReactNode
}

export function AppModal({ open, onOpenChange, onClose, title, description, children }: Props) {
  const close = () => {
    if (onOpenChange) onOpenChange(false)
    else if (onClose) onClose()
  }
  return (
    <Transition as={Fragment} show={open}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="duration-200 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="flex min-h-screen items-start justify-center p-6">
          <Transition.Child
            as={Fragment}
            enter="duration-200 ease-out"
            enterFrom="opacity-0 scale-95 -translate-y-3"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="duration-150 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95 -translate-y-3"
          >
            <Dialog.Panel className="bg-card rounded-2xl p-6 w-full max-w-3xl shadow-xl border border-border">
              {title && <Dialog.Title className="text-lg mb-2 font-semibold">{title}</Dialog.Title>}
              {description && <Dialog.Description className="text-sm text-muted-foreground mb-3">{description}</Dialog.Description>}
              {children}
              <div className="mt-4 flex justify-end">
                <button onClick={close} className="px-4 py-2 rounded-md border border-border hover:bg-white/10">Fechar</button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
