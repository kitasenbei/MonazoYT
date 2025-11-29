import { Construction } from 'lucide-react'

interface PlaceholderTabProps {
  name: string
  description: string
}

export function PlaceholderTab({ name, description }: PlaceholderTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <Construction className="h-16 w-16 text-muted-foreground/50" />
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold text-muted-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {description}
        </p>
        <p className="text-xs text-muted-foreground/70 pt-2">
          Coming soon...
        </p>
      </div>
    </div>
  )
}
