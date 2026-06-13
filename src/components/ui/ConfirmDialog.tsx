interface ConfirmDialogProps {
  title: string
  description: React.ReactNode
  icon: React.ReactNode
  iconBgClass?: string
  confirmLabel: string
  pendingLabel?: string
  confirmClassName?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
  children?: React.ReactNode
  closeOnBackdrop?: boolean
}

export function ConfirmDialog({
  title,
  description,
  icon,
  iconBgClass = 'bg-red-100',
  confirmLabel,
  pendingLabel,
  confirmClassName = 'bg-red-600 text-white',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  isPending,
  children,
  closeOnBackdrop = true,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onCancel : undefined}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${iconBgClass}`}>
          {icon}
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="mt-1 text-sm text-muted">{description}</div>
        {children}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 ${confirmClassName}`}
          >
            {isPending && pendingLabel ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
