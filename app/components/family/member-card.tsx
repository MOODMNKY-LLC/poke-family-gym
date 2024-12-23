'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getAvatarUrl } from "@/utils/get-avatar-url"
import { formatDistanceToNow } from 'date-fns'
import { cn } from "@/lib/utils"

interface FamilyMemberCardProps {
  member: {
    id: string
    displayName: string
    fullName: string
    avatarUrl: string | null
    roleId: number
    roleName: string
    personalMotto?: string | null
    lastActive: string
    dateOfBirth?: string | null
    favoriteColor?: string | null
    starterPokemon?: {
      formId: number
      nickname: string | null
      friendship: number
      experience: number
    } | null
  }
  starterPokemon?: any
}

export function FamilyMemberCard({ member, starterPokemon }: FamilyMemberCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={member.avatarUrl ? getAvatarUrl(member.avatarUrl) || undefined : undefined}
              alt={member.displayName}
            />
            <AvatarFallback>{member.displayName[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{member.displayName}</h3>
              <Badge variant="secondary">{member.roleName}</Badge>
            </div>
            {member.personalMotto ? (
              <p className="text-sm text-muted-foreground italic">"{member.personalMotto}"</p>
            ) : (
              <p className="text-sm text-muted-foreground italic text-opacity-50">"No motto set..."</p>
            )}
          </div>
        </div>

        {/* Partner Section */}
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">Partner</p>
          {starterPokemon ? (
            <div className="relative p-4 rounded-lg bg-card/50 border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{member.starterPokemon?.nickname || starterPokemon.name}</p>
                  <p className="text-xs text-muted-foreground">
                    #{String(starterPokemon.id).padStart(3, '0')} - Seed Pokémon (Gen I)
                  </p>
                </div>
                <div className="flex gap-1">
                  {starterPokemon.types.map((type: any) => (
                    <Badge key={type.type.name} variant="outline">
                      {type.type.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src={starterPokemon.sprites.front_default}
                  alt={starterPokemon.name}
                  className="w-16 h-16 object-contain"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Height</span>
                    <span>{(starterPokemon.height * 0.1).toFixed(1)}m</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Weight</span>
                    <span>{(starterPokemon.weight * 0.1).toFixed(1)}kg</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Friendship</span>
                    <span>{member.starterPokemon?.friendship || 0}/255</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Experience</span>
                    <span>{member.starterPokemon?.experience || 0}/100</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative p-4 rounded-lg bg-card/50 border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-muted-foreground">No Partner Selected</p>
                  <p className="text-xs text-muted-foreground">
                    #000 - Unknown Pokémon
                  </p>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline">???</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-16 bg-card/50 rounded-lg flex items-center justify-center">
                  <span className="text-2xl text-muted-foreground">?</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Height</span>
                    <span>0.0m</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Weight</span>
                    <span>0.0kg</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Friendship</span>
                    <span>0/255</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Experience</span>
                    <span>0/100</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Member Details */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground">Birthday:</span>
            {member.dateOfBirth ? (
              <span className="ml-2">{new Date(member.dateOfBirth).toLocaleDateString()}</span>
            ) : (
              <span className="ml-2 text-muted-foreground text-opacity-50">Not set</span>
            )}
          </div>
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground">Favorite Color:</span>
            {member.favoriteColor ? (
              <div className="flex items-center ml-2">
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: member.favoriteColor }}
                />
                <span className="ml-2">{member.favoriteColor}</span>
              </div>
            ) : (
              <span className="ml-2 text-muted-foreground text-opacity-50">Not set</span>
            )}
          </div>
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground">Last Active:</span>
            <span className="ml-2">{formatDistanceToNow(new Date(member.lastActive))} ago</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 