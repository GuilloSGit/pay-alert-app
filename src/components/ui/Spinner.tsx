interface SpinnerProps {
  size?: 'sm' | 'md'
  className?: string
}

export function Spinner({ size = 'md', className = 'border-primary' }: SpinnerProps) {
  const sizeClass = size === 'sm' ? 'h-4 w-4 border-2' : 'h-8 w-8 border-4'
  return (
    <div className={`animate-spin rounded-full border-t-transparent ${sizeClass} ${className}`} />
  )
}
