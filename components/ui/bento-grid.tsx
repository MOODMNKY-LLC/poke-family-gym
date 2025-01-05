'use client'

import { cn } from "@/lib/utils"
import { ReactNode, ReactElement } from "react"

interface BentoGridProps {
  className?: string
  children?: ReactNode
}

export interface BentoCardProps {
  name: string
  description: ReactNode
  href?: string
  Icon?: () => ReactElement
  background?: ReactNode
  className?: string
  cta?: ReactNode
  onClick?: () => void
}

export function BentoGrid({ className, children }: BentoGridProps) {
  return (
    <div className={cn("grid", className)}>
      {children}
    </div>
  )
}

export function BentoCard({
  name,
  description,
  href,
  Icon,
  background,
  className,
  cta,
  onClick
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-background p-6",
        "hover:shadow-md transition-all duration-200",
        className
      )}
      onClick={onClick}
    >
      {background}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight">
              {name}
            </h3>
            <div className="text-sm text-muted-foreground">
              {description}
            </div>
          </div>
          {Icon && (
            <div className="flex-shrink-0">
              <Icon />
            </div>
          )}
        </div>
        {cta && (
          <div className="mt-4">
            <div
              className={cn(
                "text-sm font-medium",
                "text-muted-foreground",
                "group-hover:text-primary",
                "transition-colors"
              )}
            >
              {cta}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
