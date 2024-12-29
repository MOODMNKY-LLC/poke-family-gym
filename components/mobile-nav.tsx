"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Book, User, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const routes = [
  {
    href: '/',
    label: 'Home',
    icon: Home
  },
  {
    href: '/pokedex',
    label: 'Pokédex',
    icon: Book
  },
  {
    href: '/account',
    label: 'Profile',
    icon: User
  }
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
        <div className="grid h-full max-w-lg grid-cols-3 mx-auto">
          {routes.map((route) => {
            const Icon = route.icon
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group',
                  pathname === route.href && 'text-primary'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{route.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile Menu Button - For additional items */}
      <div className="fixed top-2 right-2 z-50 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-background">
            <div className="flex flex-col gap-4 mt-4">
              <h2 className="text-lg font-bold">Menu</h2>
              {/* Add additional menu items here */}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
} 