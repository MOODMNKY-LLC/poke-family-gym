'use client'

import { motion } from 'framer-motion'
import { FamilyMemberCard } from '@/components/family/member-card'
import type { DashboardMember } from '@/types/dashboard'
import type { Pokemon } from 'pokenode-ts'

interface FamilyMembersGridProps {
  members: DashboardMember[]
  pokemonDataMap: Map<number, Pokemon>
}

export function FamilyMembersGrid({ members, pokemonDataMap }: FamilyMembersGridProps) {
  return (
    <motion.div 
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            when: "beforeChildren"
          }
        }
      }}
      initial="hidden"
      animate="visible"
    >
      {members.map((member) => {
        const starterPokemon = member.starterPokemon 
          ? pokemonDataMap.get(member.starterPokemon.formId)
          : null
        return (
          <FamilyMemberCard
            key={member.id}
            member={member}
            starterPokemon={starterPokemon}
          />
        )
      })}
    </motion.div>
  )
} 