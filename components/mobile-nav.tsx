"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const routes = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/protected",
    label: "Dashboard",
  },
  {
    href: "/pokedex",
    label: "Pokédex",
  },
  {
    href: "/trainers",
    label: "Trainers",
  },
  {
    href: "/guide",
    label: "Guide",
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="icon"
          className="h-12 w-12 rounded-full glass-effect glass-border"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[96%] pt-10 rounded-t-3xl">
        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            {routes.map((route) => (
              <Button
                key={route.href}
                variant={pathname === route.href ? "default" : "ghost"}
                className="w-full justify-start text-lg font-medium"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link href={route.href}>
                  {route.label}
                </Link>
              </Button>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Quick Links
            </div>
            <div className="mt-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-base"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link href="/account">
                  Settings
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-base"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link href="/protected/shop">
                  Shop
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-base"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link href="/protected/tasks">
                  Tasks
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 