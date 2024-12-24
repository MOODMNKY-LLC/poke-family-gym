'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, SortAsc, Filter } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { FamilyPokedexEntry, PokemonWithEntry } from '../../../types/pokemon'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
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

interface PokedexTableProps {
  entries: FamilyPokedexEntry[]
  totalCaught: number
  totalAvailable: number
}

export function PokedexTable({ entries, totalCaught, totalAvailable }: PokedexTableProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-primary">
          Family Pokédex
        </h2>
        <Badge variant="outline" className="text-primary">
          {totalCaught} / {totalAvailable} Caught
        </Badge>
      </div>

      {/* Search and Filter */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Pokémon..."
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <SortAsc className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pokédex Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Caught By</TableHead>
                  <TableHead>Caught At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No Pokémon caught yet. Start your journey by catching your first Pokémon!
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {entries.map((entry) => (
                      <motion.tr
                        key={entry.id}
                        variants={itemVariants}
                        className="group hover:bg-muted/50"
                      >
                        <TableCell className="font-mono">
                          #{String(entry.pokemonId).padStart(3, '0')}
                        </TableCell>
                        <TableCell>
                          {entry.nickname || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {/* TODO: Add type badges */}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.caughtBy?.display_name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {new Date(entry.caught_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 