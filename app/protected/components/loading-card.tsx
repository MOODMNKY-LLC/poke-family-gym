import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LoadingCardProps {
  className?: string
  rows?: number
}

export function LoadingCard({ className, rows = 3 }: LoadingCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader>
        <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </CardContent>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </Card>
  )
} 