"use client"

import { motion } from "framer-motion"
import { Search, Grid, LayoutDashboard, BarChart2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function PokedexHero() {
  const features = [
    {
      icon: Search,
      title: "Smart Search",
      description: "Find Pokémon by name across all generations"
    },
    {
      icon: Grid,
      title: "Multiple Views",
      description: "Gallery, Table, Type Groups, and Stats views"
    },
    {
      icon: LayoutDashboard,
      title: "Type Analysis",
      description: "Explore Pokémon grouped by their primary types"
    },
    {
      icon: BarChart2,
      title: "Detailed Stats",
      description: "Compare Pokémon stats and characteristics"
    }
  ]

  return (
    <div className="relative overflow-hidden border-b">
      {/* Seamless Grid Background */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,#FFB6C10A,transparent)]" />
      <div 
        className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background"
      />

      <div className="container relative">
        <div className="flex flex-col items-center gap-4 py-12 lg:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <Badge 
              className="mb-4 relative" 
              variant="outline"
            >
              All Generations Available
            </Badge>
            <h1 className="text-3xl lg:text-4xl xl:text-6xl font-bold tracking-tighter mb-4">
              Comprehensive Pokédex
            </h1>
            <p className="mx-auto max-w-[700px] text-base lg:text-lg text-muted-foreground">
              Explore, search, and analyze Pokémon across all generations. 
              View detailed stats, type matchups, and evolution chains.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8 w-full">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={cn(
                  "p-6 h-full relative group transition-all duration-300",
                  "hover:shadow-lg hover:shadow-primary/5",
                  "bg-gradient-to-b from-card/50 to-card",
                  "backdrop-blur-sm border-primary/5"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <feature.icon className="h-8 w-8 mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 