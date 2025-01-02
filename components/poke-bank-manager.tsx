import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PokeBallActions } from './poke-bank-actions'
import { RefreshButton } from './refresh-button'
import { getAvatarUrl } from '@/utils/get-avatar-url'
import { getPokeBallImage } from '@/lib/utils'
import AvatarCircles from '@/components/ui/avatar-circles'

interface FamilyMember {
  id: string
  family_id: string
  display_name: string
  avatar_url: string | null
  pokeball_balance: number
  great_ball_balance: number
  ultra_ball_balance: number
  master_ball_balance: number
}

export default async function PokeBankManager() {
  const supabase = await createClient()

  const { data: familyMembers } = await supabase
    .from('family_members')
    .select('id, family_id, display_name, avatar_url, pokeball_balance, great_ball_balance, ultra_ball_balance, master_ball_balance')
    .order('display_name')

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Poké Bank Manager</CardTitle>
          <CardDescription>View and manage family members' Pokéball balances</CardDescription>
        </div>
        <RefreshButton />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Poké Balls</TableHead>
              <TableHead>Great Balls</TableHead>
              <TableHead>Ultra Balls</TableHead>
              <TableHead>Master Balls</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {familyMembers?.map((member) => {
              const avatarUrl = member.avatar_url ? getAvatarUrl(member.avatar_url) || getPokeBallImage('light') : getPokeBallImage('light')
              return (
                <TableRow key={member.id}>
                  <TableCell className="flex items-center gap-2">
                    <AvatarCircles
                      avatarUrls={[{
                        imageUrl: avatarUrl,
                        profileUrl: `/protected/trainers/${member.id}`
                      }]}
                    />
                    <span>{member.display_name}</span>
                  </TableCell>
                  <TableCell>{member.pokeball_balance}</TableCell>
                  <TableCell>{member.great_ball_balance}</TableCell>
                  <TableCell>{member.ultra_ball_balance}</TableCell>
                  <TableCell>{member.master_ball_balance}</TableCell>
                  <TableCell>
                    <PokeBallActions memberId={member.id} familyId={member.family_id} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 