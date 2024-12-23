"use client"

import { PokeBall } from "@/components/icons/pokeball"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { PokemonClient } from "pokenode-ts"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Trophy, 
  Users, 
  Swords,
  Sparkles,
  GraduationCap,
  Star,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StarterCard, type StarterPokemon } from "@/components/pokemon/starter-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Marquee from "@/components/ui/marquee"

// Animation variants for reuse
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

interface PokeBallAnimation {
  y: number
  duration: number
}

interface StarterGroup {
  generation: number
  starters: StarterPokemon[]
}

// Add this new component for the Pokéball selector
const PokeBallSelector = ({ 
  value, 
  onChange, 
  options 
}: { 
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) => {
  return (
    <div className="flex gap-4 justify-center">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative group transition-all duration-300",
            value === option.value ? "scale-110" : "hover:scale-105"
          )}
        >
          <PokeBall 
            className={cn(
              "w-12 h-12 transition-colors duration-300",
              value === option.value 
                ? "text-primary" 
                : "text-muted-foreground/50 group-hover:text-muted-foreground"
            )} 
          />
          <div className={cn(
            "absolute inset-0 flex items-center justify-center font-bold text-sm",
            value === option.value 
              ? "text-primary-foreground" 
              : "text-muted-foreground/50 group-hover:text-muted-foreground"
          )}>
            {option.value}
          </div>
          <div className={cn(
            "absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap",
            "opacity-0 translate-y-2 transition-all duration-300",
            "group-hover:opacity-100 group-hover:translate-y-0",
            value === option.value ? "!opacity-100 !translate-y-0" : ""
          )}>
            {option.label}
          </div>
        </button>
      ))}
    </div>
  )
}

export default function Home() {
  const [starterGroups, setStarterGroups] = useState<StarterGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pokeBallAnimations, setPokeBallAnimations] = useState<PokeBallAnimation[]>([])
  const [selectedGen, setSelectedGen] = useState<number>(1)

  // Fetch starter Pokémon data
  useEffect(() => {
    async function fetchStarters() {
      try {
        const api = new PokemonClient()
        // Starter Pokémon IDs for first 3 generations
        const startersByGen = {
          1: [1, 4, 7],    // Bulbasaur, Charmander, Squirtle
          2: [152, 155, 158], // Chikorita, Cyndaquil, Totodile
          3: [252, 255, 258]  // Treecko, Torchic, Mudkip
        }

        const groups = await Promise.all(
          Object.entries(startersByGen).map(async ([gen, ids]) => {
            const starters = await Promise.all(
              ids.map(async (id) => {
                const [pokemon, species] = await Promise.all([
                  api.getPokemonById(id),
                  api.getPokemonSpeciesById(id)
                ])

                return {
                  id: pokemon.id,
                  name: pokemon.name,
                  spriteUrl: pokemon.sprites.other?.["official-artwork"].front_default || "",
                  types: pokemon.types.map(t => t.type.name),
                  height: pokemon.height,
                  weight: pokemon.weight,
                  category: species.genera.find(g => g.language.name === "en")?.genus || "",
                  generation: parseInt(species.generation.url.split('/').slice(-2, -1)[0]),
                  description: species.flavor_text_entries
                    .find(entry => entry.language.name === "en")
                    ?.flavor_text.replace(/\f/g, ' ') || "",
                  stats: pokemon.stats.map(s => ({
                    name: s.stat.name,
                    base: s.base_stat
                  })),
                  abilities: pokemon.abilities
                    .filter(a => !a.is_hidden)
                    .map(a => a.ability.name)
                }
              })
            )

            return {
              generation: parseInt(gen),
              starters
            }
          })
        )
        
        setStarterGroups(groups)
      } catch (error) {
        console.error("Failed to fetch starter Pokémon:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStarters()
  }, [])

  // Initialize pokeball animations once
  useEffect(() => {
    setPokeBallAnimations(
      Array.from({ length: 5 }, () => ({
        y: Math.random() * 500,
        duration: 15 + Math.random() * 10
      }))
    )
  }, [])

  // Updated features section data
  const features = [
    {
      icon: Trophy,
      title: "Family Gym Badges",
      description: "Turn daily tasks into Gym Badge challenges! Earn Poké Balls and power up with victory streaks! ✨"
    },
    {
      icon: Users,
      title: "Team Family Power",
      description: "Parents become Gym Leaders, kids become Trainers! Team up for special family combo moves and grow stronger together! 🌟"
    },
    {
      icon: Swords,
      title: "Mystery PokéPacks",
      description: "Use Poké Balls to discover mystery Pokémon! Trade with family members and unlock special surprises! 🎁"
    },
    {
      icon: GraduationCap,
      title: "Trainer Achievements",
      description: "Level up with titles like 'Ace Trainer' and 'Family Champion'! Complete your Family Pokédex and become legendary! 🏆"
    }
  ]

  const workflowSteps = [
    {
      step: "1",
      title: "Power Up Your Gym",
      description: "Create your Family Gym, invite your team, and prepare for an amazing adventure! 🏰",
      icon: Users,
    },
    {
      step: "2",
      title: "Meet Your Pokémon",
      description: "Choose your special Pokémon friend from different regions and start your journey together! ⭐",
      icon: Star,
    },
    {
      step: "3",
      title: "Start Your Quest",
      description: "Complete challenges, earn rewards, and fill your Family Pokédex with treasures! 🌈",
      icon: Sparkles,
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-card">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-background/60" />
        
        {/* Animated Pokéballs Background */}
        <div className="absolute inset-0 overflow-hidden">
          {pokeBallAnimations.map((animation, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: -100, 
                y: animation.y,
                opacity: 0.3 
              }}
              animate={{
                x: "120vw",
                rotate: 360,
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: animation.duration,
                repeat: Infinity,
                delay: i * 2,
                ease: "linear"
              }}
            >
              <PokeBall className="w-12 h-12 text-primary/20" />
            </motion.div>
          ))}
        </div>

        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-4rem)] py-12 lg:py-20">
            {/* Hero Content */}
            <motion.div
              {...fadeInUp}
              className="text-left order-2 lg:order-1"
            >
              <div className="flex flex-col gap-4 mb-6 lg:mb-8">
                <Badge 
                  variant="outline" 
                  className="w-fit text-sm lg:text-base px-3 lg:px-4 py-1 border-primary/20 animate-pulse"
                >
                  New Trainer Registration Open! • Special Starter Pokémon Bonus ⭐
                </Badge>
                <div className="space-y-2">
                  <h2 className="text-lg lg:text-xl font-medium text-primary">
                    Welcome to
                  </h2>
                  <h1 className="text-3xl lg:text-5xl xl:text-7xl font-bold tracking-tighter">
                    The Family Poké
                    <br />
                    <span className="text-primary relative inline-flex items-center gap-2 lg:gap-4">
                      Gym
                      <PokeBall 
                        className="w-6 h-6 lg:w-8 lg:h-8 text-primary inline-block transition-transform hover:rotate-180" 
                      />
                    </span>
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-[600px] mt-4">
                    Transform daily tasks into Pokémon adventures! Earn rewards, collect Pokémon, and grow together! ✨
                  </p>
                </div>
              </div>

              {/* Update CTA buttons for better mobile display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-8"
              >
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full sm:w-auto gap-2 text-base lg:text-lg px-6 lg:px-8 py-5 lg:py-6 bg-primary hover:bg-primary/90"
                >
                  <Link href="/sign-up">
                    Open Your Gym
                    <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto gap-2 text-base lg:text-lg px-6 lg:px-8 py-5 lg:py-6"
                >
                  <Link href="/pokedex">
                    Browse Pokédex
                    <PokeBall className="ml-2 h-4 w-4 lg:h-5 lg:w-5" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Starter Pokemon Display - Update for mobile */}
            <div className="relative h-[400px] lg:h-[500px] order-1 lg:order-2">
              {/* PokeBall Generation Selector */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                <PokeBallSelector
                  value={selectedGen?.toString() || "1"}
                  onChange={(value) => {
                    setIsLoading(true)
                    setTimeout(() => {
                      setSelectedGen(parseInt(value))
                      setIsLoading(false)
                    }, 100)
                  }}
                  options={[
                    { value: "1", label: "Kanto" },
                    { value: "2", label: "Johto" },
                    { value: "3", label: "Hoenn" }
                  ]}
                />
              </div>

              {/* Cards Display with Marquee */}
              <div className="relative w-full mt-16">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
                
                {/* Main Content */}
                <div className="relative overflow-hidden h-[550px]">
                  {isLoading ? (
                    <div className="flex gap-4 justify-center">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="w-[350px] h-[500px] animate-pulse">
                          <div className="w-full h-full bg-muted/50 rounded-lg" />
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      {starterGroups.map((group) => (
                        <motion.div
                          key={group.generation}
                          initial={{ opacity: 0 }}
                          animate={{ 
                            opacity: group.generation === selectedGen ? 1 : 0,
                            display: group.generation === selectedGen ? 'block' : 'none'
                          }}
                          exit={{ opacity: 0 }}
                        >
                          <Marquee
                            className="py-8 backdrop-blur-sm"
                            pauseOnHover
                            reverse={group.generation % 2 === 0}
                            repeat={2}
                          >
                            {group.starters.map((pokemon, index) => (
                              <motion.div
                                key={pokemon.id}
                                className="relative w-[350px] mx-8"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ 
                                  opacity: 1,
                                  scale: 1
                                }}
                                transition={{
                                  duration: 0.6,
                                  delay: index * 0.1,
                                  ease: [0.23, 1, 0.32, 1]
                                }}
                                whileHover={{
                                  scale: 1.05,
                                  zIndex: 10,
                                  transition: {
                                    duration: 0.2,
                                    ease: "easeOut"
                                  }
                                }}
                              >
                                <div className="relative group">
                                  {/* Card shine effect */}
                                  <div 
                                    className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                    style={{ mixBlendMode: 'overlay' }}
                                  />
                                  
                                  {/* Type indicator dots */}
                                  <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                                    {pokemon.types.map((type) => (
                                      <div
                                        key={type}
                                        className={cn(
                                          "w-4 h-4 rounded-full ring-2 ring-background",
                                          `bg-pokemon-${type}`
                                        )}
                                      />
                                    ))}
                                  </div>

                                  <StarterCard
                                    pokemon={pokemon}
                                    isSelected={false}
                                    onSelect={() => {}}
                                  />
                                </div>
                              </motion.div>
                            ))}
                          </Marquee>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Updated titles and descriptions */}
      <motion.section 
        className="container py-20"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
            >
              <Card className="p-6 h-full bg-card hover:shadow-lg transition-shadow">
                <feature.icon className="h-12 w-12 mb-4 text-primary" />
                <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How It Works Section - Updated copy */}
      <section className="border-t border-b bg-card/50">
        <div className="container py-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Your Epic Family Quest Begins
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Become the Ultimate Family Team
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-[700px] mx-auto">
              Join families discovering the magic in everyday moments! 
              Catch Pokémon, earn rewards, and create memories together! ✨
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workflowSteps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                <Card className={cn(
                  "p-6 h-full",
                  "hover:shadow-lg transition-shadow",
                  "bg-card/50 backdrop-blur-sm"
                )}>
                  <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <item.icon className="h-8 w-8 mb-4 text-primary" />
                  <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Updated copy */}
      <section className="container py-20">
        <Card className="p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
          <div className="relative">
            <Badge className="mb-4" variant="outline">
              Special Welcome Bonus
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
              Ready to Be a Family Gym Leader?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-[700px] mx-auto">
              Start your adventure with a special welcome pack! Choose your partner Pokémon 
              and join amazing families on this magical journey! ✨
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/sign-up">
                  Start Your Journey
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                Free to join • Start your adventure today!
              </span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
