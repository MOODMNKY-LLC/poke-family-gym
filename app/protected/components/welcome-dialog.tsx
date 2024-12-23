'use client'

import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Home, 
  CircleDot, 
  UserCircle,
  Sparkles
} from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

const navigationOptions = [
  {
    title: "Family Dashboard",
    description: "Start your journey as a Family Gym Leader and manage your trainers",
    icon: Home,
    href: "/protected",
    primary: true
  },
  {
    title: "Customize Profile",
    description: "Set up your Gym Leader profile and customize your family gym's appearance",
    icon: UserCircle,
    href: "/protected/trainers",
  },
  {
    title: "Explore Pokédex",
    description: "Discover all the Pokémon species that await your family's adventures",
    icon: CircleDot,
    href: "/pokedex"
  }
]

interface WelcomeDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function WelcomeDialog({ isOpen, onOpenChange }: WelcomeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <VisuallyHidden>
          <DialogTitle>Welcome to Your Family Gym</DialogTitle>
        </VisuallyHidden>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20
              }}
            >
              <Sparkles className="w-12 h-12 mx-auto text-yellow-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-primary">
              Congratulations, Gym Leader!
            </h2>
            <p className="text-muted-foreground">
              Your Family Pokémon Gym is now officially registered! Ready to start your family's Pokémon adventure?
            </p>
          </div>

          <div className="grid gap-3">
            {navigationOptions.map((option) => (
              <Link key={option.href} href={option.href} onClick={() => onOpenChange(false)}>
                <Button
                  variant={option.primary ? "default" : "outline"}
                  className="w-full h-auto py-4 px-4"
                >
                  <div className="flex items-center gap-4">
                    <option.icon className={`
                      w-6 h-6 flex-shrink-0
                      ${option.primary ? 'text-primary-foreground' : 'text-primary'}
                    `} />
                    <div className="text-left">
                      <h3 className={`font-semibold ${option.primary ? 'text-primary-foreground' : ''}`}>
                        {option.title}
                      </h3>
                      <p className={`text-sm ${option.primary ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                </Button>
              </Link>
            ))}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Want to learn more about managing your gym? Check out our{" "}
              <Link 
                href="/guide" 
                className="text-primary hover:underline"
                onClick={() => onOpenChange(false)}
              >
                Trainer's Guide
              </Link>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 