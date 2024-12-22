"use client"

import { LayoutGrid, Table, LayoutDashboard, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export type ViewMode = "grid" | "table" | "kanban" | "stats"

interface ViewSwitcherProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

const viewOptions = [
  { id: "grid", label: "Gallery", icon: LayoutGrid },
  { id: "table", label: "Table", icon: Table },
  { id: "kanban", label: "By Type", icon: LayoutDashboard },
  { id: "stats", label: "Stats", icon: BarChart2 },
] as const

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const currentOption = viewOptions.find((opt) => opt.id === currentView)
  const Icon = currentOption?.icon || LayoutGrid
  const isMobile = useIsMobile()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-[120px] justify-start">
          <Icon className="mr-2 h-4 w-4" />
          {currentOption?.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {viewOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onViewChange(option.id as ViewMode)}
          >
            <option.icon className="mr-2 h-4 w-4" />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 