'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, Star } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { DashboardMember } from "@/types/dashboard"
import type { Pokemon } from "pokenode-ts"

interface MemberCardProps {
  member: DashboardMember
  starterPokemon: Pokemon | null
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 1
    }
  }
}

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.2,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
}

export function FamilyMemberCard({ member, starterPokemon }: MemberCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={cn(
        "overflow-hidden relative",
        "glass-card glass-border"
      )}>
        <CardHeader className="p-0">
          <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              variants={contentVariants}
            >
              {starterPokemon ? (
                <motion.img
                  src={starterPokemon.sprites.front_default || ''}
                  alt={starterPokemon.name}
                  className="w-32 h-32 object-contain transform scale-150 opacity-50"
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0.5 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <Star className="w-12 h-12 text-primary/20" />
              )}
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <motion.div 
            className="space-y-4"
            variants={contentVariants}
          >
            <div className="flex items-start justify-between">
              <motion.div variants={itemVariants} className="space-y-1">
                <h3 className="font-semibold text-lg">
                  {member.displayName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {member.birthDate}
                </p>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <Badge 
                variant="secondary" 
                className={cn(
                  "bg-primary/10 text-primary",
                  "border-primary/20"
                )}
              >
                {member.role.name}
              </Badge>
            </motion.div>

            {member.personalMotto && (
              <motion.p 
                variants={itemVariants}
                className="text-sm text-muted-foreground italic"
              >
                "{member.personalMotto}"
              </motion.p>
            )}

            {starterPokemon && (
              <motion.div 
                variants={itemVariants}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8">
                  <motion.img
                    src={starterPokemon.sprites.front_default || ''}
                    alt={starterPokemon.name}
                    className="w-full h-full object-contain"
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium capitalize">
                    {member.starterPokemon?.nickname || starterPokemon.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Partner Pokémon
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 