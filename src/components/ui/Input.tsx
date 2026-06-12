import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  suffix?: ReactNode
}

export function Input({ label, error, id, className = '', suffix, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          {...props}
          className={`h-10 w-full rounded-lg border bg-white text-sm text-foreground placeholder:text-muted
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:bg-gray-50 disabled:text-muted disabled:cursor-not-allowed
            ${suffix ? 'pl-3 pr-10' : 'px-3'}
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-border'}
            ${className}`}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
