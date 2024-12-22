"use client"

import { motion } from "framer-motion"
import { Search, Grid, LayoutDashboard, BarChart2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

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
    <div className="relative overflow-hidden border-b bg-card">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background to-background/60" />

      <div className="container relative">
        <div className="flex flex-col items-center gap-4 py-8 lg:py-12 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-3 lg:mb-4" variant="outline">
              Generation I to IX
            </Badge>
            <h1 className="text-2xl lg:text-3xl xl:text-5xl font-bold tracking-tighter">
              Comprehensive Pokédex
            </h1>
            <p className="mx-auto mt-3 lg:mt-4 max-w-[700px] text-sm lg:text-base text-muted-foreground">
              Explore, search, and analyze Pokémon across all generations. 
              View detailed stats, type matchups, and evolution chains in multiple interactive layouts.
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
                <Card className="p-6 h-full bg-card/50 backdrop-blur-sm">
                  <feature.icon className="h-6 w-6 mb-3 text-primary" />
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