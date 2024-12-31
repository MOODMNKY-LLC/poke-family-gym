"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Search, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface FamilyMember {
  id: string
  created_at: string
  family_id: string
  user_id: string
  role: string
  status: string
  profiles: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
  } | null
}

export default function TrainersPage() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data: familyMembers, error } = await supabase
          .from("family_members")
          .select(`
            *,
            profiles:user_id (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq("status", "active")

        if (error) throw error

        setMembers(familyMembers as FamilyMember[])
      } catch (error) {
        console.error("Error fetching family members:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  const filteredMembers = members.filter((member) => {
    const searchTerm = searchQuery.toLowerCase()
    const fullName = member.profiles?.full_name?.toLowerCase() || ""
    const username = member.profiles?.username?.toLowerCase() || ""
    const role = member.role?.toLowerCase() || ""

    return (
      fullName.includes(searchTerm) ||
      username.includes(searchTerm) ||
      role.includes(searchTerm)
    )
  })

  function getRoleColor(role: string) {
    switch (role.toLowerCase()) {
      case "admin":
        return "text-red-500"
      case "parent":
        return "text-blue-500"
      case "child":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
      <section className="relative border-b bg-card">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-background/60" />
        
        <div className="container relative py-12">
          <div className="flex flex-col gap-4 max-w-[800px]">
            <Badge 
              variant="outline" 
              className="w-fit text-sm px-3 py-1 border-primary/20"
            >
              Trainers • Meet Your Fellow Gym Members
            </Badge>
            <h1 className="text-4xl font-bold tracking-tighter">
              Family Gym Trainers
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover and connect with other trainers in your Family Gym!
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <div className="container py-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trainers by name, username, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Trainers Grid */}
      <div className="container pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-start space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.profiles?.avatar_url || ""} />
                    <AvatarFallback>
                      {member.profiles?.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-semibold">
                      {member.profiles?.full_name || "Unknown Trainer"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{member.profiles?.username || "unknown"}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn("mt-2", getRoleColor(member.role))}
                    >
                      {member.role}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No trainers found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 