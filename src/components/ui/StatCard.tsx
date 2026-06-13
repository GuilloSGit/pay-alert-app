import { Card } from './Card'

interface StatCardProps {
  label: string
  caption?: React.ReactNode
  isLoading?: boolean
  children: React.ReactNode
}

export function StatCard({ label, caption, isLoading, children }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-sm font-medium text-muted">{label}</p>
      {isLoading
        ? <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
        : children
      }
      {caption != null && <p className="text-xs text-muted">{caption}</p>}
    </Card>
  )
}
