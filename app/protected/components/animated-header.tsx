'use client'

import { motion } from 'framer-motion'
import { AddFamilyMemberDialog } from './add-family-member-dialog'
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getPokeBallImage } from "@/lib/utils"
import { useTheme } from "next-themes"
import type { Role } from '@/types/types'
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from 'react'

interface AnimatedHeaderProps {
  familyName: string
  motto: string | null
  gymLevel: number
  pointsToNextLevel: number
  userId: string
  roles: Role[]
}

export function AnimatedHeader({
  familyName,
  motto,
  gymLevel,
  pointsToNextLevel,
  userId,
  roles
}: AnimatedHeaderProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by using default light theme image during SSR
  const pokeBallImage = mounted ? getPokeBallImage(theme) : '/images/pokeball-light.svg'

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-8 mb-8 w-full"
    >
      <motion.div 
        className="space-y-4 w-full md:w-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Badge 
          variant="outline" 
          className="w-fit text-xs sm:text-sm lg:text-base px-2 sm:px-3 lg:px-4 py-1 border-primary/20 whitespace-nowrap"
        >
          <span className="hidden sm:inline">Family Gym Level {gymLevel} • {pointsToNextLevel} points to next level ⭐</span>
          <span className="sm:hidden">Lvl {gymLevel} • {pointsToNextLevel} pts ⭐</span>
        </Badge>
        <div className="space-y-2">
          <h2 className="text-base sm:text-lg lg:text-xl font-medium text-primary">
            Welcome to
          </h2>
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tighter">
            The {familyName} Family
            <br />
            <span className="text-primary relative inline-flex items-center gap-2 lg:gap-4">
              Poké Gym
              <div className="relative w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 transition-transform hover:rotate-180">
                <Image
                  src={pokeBallImage}
                  alt="PokéBall"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </span>
          </h1>
          {motto && (
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-[600px] mt-4">
              {motto}
            </p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-row md:flex-col items-center gap-2 md:gap-4 w-full md:w-auto justify-end"
      >
        <Button 
          variant="outline" 
          size="sm" 
          asChild 
          className={cn(
            "glass-effect glass-border",
            "hover:bg-primary/10 text-primary",
            "transition-colors duration-200",
            "w-full md:w-auto justify-center"
          )}
        >
          <Link href="/account">
            <Settings className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Family Settings</span>
          </Link>
        </Button>
        <AddFamilyMemberDialog familyId={userId} roles={roles} />
      </motion.div>
    </motion.div>
  )
} 