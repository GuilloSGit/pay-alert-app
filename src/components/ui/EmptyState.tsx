interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  size?: 'sm' | 'default'
  className?: string
}

export function EmptyState({ icon, title, description, size = 'default', className }: EmptyStateProps) {
  const paddingClass = size === 'sm' ? 'py-6' : 'py-16'
  const iconWrapperClass = size === 'sm' ? 'mb-3 h-12 w-12' : 'mb-4 h-16 w-16'

  return (
    <div className={`flex flex-col items-center justify-center text-center ${paddingClass}${className ? ` ${className}` : ''}`}>
      {icon && (
        <div className={`flex shrink-0 items-center justify-center rounded-full bg-gray-100 text-muted ${iconWrapperClass}`}>
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  )
}
