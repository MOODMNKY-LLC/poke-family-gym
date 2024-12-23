"use client"

import Link from "next/link"
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAvatarUrl } from '@/utils/get-avatar-url'
import { cn } from '@/lib/utils'
import { PokemonPartnerCard } from '@/components/pokemon/partner-card'
import type { DashboardData } from '@/types/dashboard'

interface FamilyMemberCardProps {
  member: DashboardData['members'][0]
  starterPokemon: any // TODO: Type this properly
}

export function FamilyMemberCard({ member, starterPokemon }: FamilyMemberCardProps) {
  return (
    <Link 
      href={`/protected/trainers/${member.id}`}
      className="block group"
    >
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-accent">
              <AvatarImage 
                src={member.avatarUrl ? getAvatarUrl(member.avatarUrl) ?? undefined : undefined} 
                alt={member.displayName}
              />
              <AvatarFallback className="text-2xl">
                {member.displayName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle>{member.displayName}</CardTitle>
              <CardDescription className="capitalize flex items-center gap-2">
                {member.role.name} Trainer
                <span className={cn(
                  "inline-flex h-2 w-2 rounded-full",
                  member.status === 'online' ? "bg-green-500" : "bg-muted"
                )} />
              </CardDescription>
              <p className="mt-1 text-sm italic text-muted-foreground">
                {member.personalMotto ? `"${member.personalMotto}"` : "No motto set..."}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <dt className="text-muted-foreground mb-2">Partner</dt>
              <dd>
                {member.starterPokemon && starterPokemon ? (
                  <PokemonPartnerCard
                    pokemon={starterPokemon}
                    nickname={member.starterPokemon.nickname}
                    friendship={member.starterPokemon.friendship}
                    experience={member.starterPokemon.experience}
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">No partner selected...</div>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Birthday</dt>
              <dd className="font-medium">
                {member.birthDate ? new Date(member.birthDate).toLocaleDateString() : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Favorite Color</dt>
              <dd className="font-medium flex items-center gap-2">
                {member.favoriteColor ? (
                  <>
                    <div 
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: member.favoriteColor }}
                    />
                    <span className="capitalize">{member.favoriteColor}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Active</dt>
              <dd className="font-medium">
                {formatDistanceToNow(new Date(member.lastActive), { addSuffix: true })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </Link>
  )
} 