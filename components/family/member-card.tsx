"use client"

import Link from "next/link"
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PokemonPartnerCard } from "@/components/pokemon/partner-card"
import { getAvatarUrl } from "@/utils/get-avatar-url"
import { cn } from "@/lib/utils"

interface FamilyMemberCardProps {
  member: {
    id: string
    displayName: string
    role: {
      name: string
      color?: string
    }
    avatarUrl?: string | null
    status: string
    personalMotto?: string | null
    birthDate?: string | null
    favoriteColor?: string | null
    lastActive: string
    starterPokemon?: {
      formId: number
      nickname: string | null
      friendship: number
      experience: number
    } | null
  }
  starterPokemon?: any // TODO: Type this properly
}

export function FamilyMemberCard({ member, starterPokemon }: FamilyMemberCardProps) {
  // Helper function to determine if status is online
  const isOnline = member.status.toLowerCase() === 'online'

  // Get avatar URL
  const avatarUrl = member.avatarUrl ? getAvatarUrl(member.avatarUrl) : null

  return (
    <Link 
      href={`/protected/trainers/${member.id}`}
      className="block group"
    >
      <Card className="overflow-hidden transition-colors hover:bg-accent/50">
        <CardHeader className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-accent">
              <AvatarImage 
                src={avatarUrl || undefined}
                alt={member.displayName} 
              />
              <AvatarFallback className="text-2xl">
                {member.displayName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg leading-none truncate">
                  {member.displayName}
                </h3>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "capitalize",
                    member.role.color && `bg-${member.role.color}-500/10 text-${member.role.color}-500`
                  )}
                >
                  {member.role.name}
                </Badge>
                <span className={cn(
                  "inline-flex h-2 w-2 rounded-full",
                  isOnline ? "bg-green-500" : "bg-muted"
                )} />
              </div>
              {member.personalMotto && (
                <p className="text-sm italic text-muted-foreground truncate">
                  "{member.personalMotto}"
                </p>
              )}
              {member.starterPokemon && (
                <p className="text-sm text-muted-foreground truncate">
                  Partner: {member.starterPokemon.nickname || starterPokemon?.name || 'Unknown'}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        {starterPokemon && member.starterPokemon && (
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Birthday</span>
                <span className="font-medium">
                  {member.birthDate ? new Date(member.birthDate).toLocaleDateString() : "Not set"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Favorite Color</span>
                <span className="font-medium flex items-center gap-2">
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
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block">Last Active</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(member.lastActive), { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="relative w-full max-w-sm mx-auto">
              <PokemonPartnerCard
                pokemon={starterPokemon}
                nickname={member.starterPokemon.nickname}
                friendship={member.starterPokemon.friendship}
                experience={member.starterPokemon.experience}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  )
} 