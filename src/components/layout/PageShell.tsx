import { Header } from './Header'

interface PageShellProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function PageShell({ title, children, className }: PageShellProps) {
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title={title} />
      <main className={`flex-1 p-6${className ? ` ${className}` : ''}`}>
        {children}
      </main>
    </div>
  )
}
