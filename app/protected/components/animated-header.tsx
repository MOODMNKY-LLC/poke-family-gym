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
      className="flex items-start justify-between mb-8"
    >
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Badge 
          variant="outline" 
          className="w-fit text-sm lg:text-base px-3 lg:px-4 py-1 border-primary/20"
        >
          Family Gym Level {gymLevel} • {pointsToNextLevel} points to next level ⭐
        </Badge>
        <div className="space-y-2">
          <h2 className="text-lg lg:text-xl font-medium text-primary">
            Welcome to
          </h2>
          <h1 className="text-3xl lg:text-5xl font-bold tracking-tighter">
            The {familyName} Family
            <br />
            <span className="text-primary relative inline-flex items-center gap-2 lg:gap-4">
              Poké Gym
              <div className="relative w-6 h-6 lg:w-8 lg:h-8 transition-transform hover:rotate-180">
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
            <p className="text-lg text-muted-foreground max-w-[600px] mt-4">
              {motto}
            </p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4"
      >
        <Button 
          variant="outline" 
          size="sm" 
          asChild 
          className={cn(
            "glass-effect glass-border",
            "hover:bg-primary/10 text-primary",
            "transition-colors duration-200"
          )}
        >
          <Link href="/account">
            <Settings className="h-4 w-4 mr-2" />
            Family Settings
          </Link>
        </Button>
        <AddFamilyMemberDialog familyId={userId} roles={roles} />
      </motion.div>
    </motion.div>
  )
} 