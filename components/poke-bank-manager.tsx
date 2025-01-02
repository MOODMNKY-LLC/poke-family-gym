'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PokeBallActions } from '@/components/poke-bank-actions'
import { RefreshButton } from '@/components/refresh-button'
import { getAvatarUrl } from '@/utils/get-avatar-url'
import { getPokeBallImage } from '@/lib/utils'
import AvatarCircles from '@/components/ui/avatar-circles'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from 'date-fns'
import { ArrowLeftRight, History, Wallet, ArrowUpDown } from 'lucide-react'

// Exchange rates in terms of regular Poké Balls
const EXCHANGE_RATES = {
  poke_ball: 1,
  great_ball: 10,
  ultra_ball: 50,
  master_ball: 100
} as const

type BallType = keyof typeof EXCHANGE_RATES

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

interface Transaction {
  id: string
  member_id: string
  ball_type: BallType
  amount: number
  reason: string
  created_at: string
  details?: {
    exchange_type?: 'withdrawal' | 'deposit'
    transfer_type?: 'withdrawal' | 'deposit'
    target_type?: BallType
    target_amount?: number
    source_type?: BallType
    source_amount?: number
    to_member?: string
    from_member?: string
  }
  member: {
    display_name: string
  }
}

export default function PokeBankManager() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [targetMember, setTargetMember] = useState<string | null>(null)
  const [transferAmount, setTransferAmount] = useState('')
  const [selectedBallType, setSelectedBallType] = useState<BallType>('poke_ball')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [exchangeFrom, setExchangeFrom] = useState<BallType>('poke_ball')
  const [exchangeTo, setExchangeTo] = useState<BallType>('great_ball')
  const [exchangeAmount, setExchangeAmount] = useState('')
  const { toast } = useToast()

  // Calculate exchange rate between two ball types
  const getExchangeRate = (from: BallType, to: BallType) => {
    const fromRate = EXCHANGE_RATES[from]
    const toRate = EXCHANGE_RATES[to]
    return fromRate / toRate
  }

  // Calculate how many target balls you get for the source balls
  const calculateExchange = (amount: number, from: BallType, to: BallType) => {
    const rate = getExchangeRate(from, to)
    return Math.floor(amount * rate)
  }

  const handleExchange = async (memberId: string) => {
    try {
      setIsLoading(true)
      const amount = parseInt(exchangeAmount)
      
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid number greater than 0",
          variant: "destructive"
        })
        return
      }

      const supabase = createClient()

      // Get member data
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .select('id, family_id, display_name, pokeball_balance, great_ball_balance, ultra_ball_balance, master_ball_balance')
        .eq('id', memberId)
        .single()

      if (memberError) {
        throw new Error(`Failed to fetch member data: ${memberError.message}`)
      }
      
      if (!member) {
        throw new Error('Member not found')
      }

      // Check if member has enough source balls
      const sourceBalanceKey = `${exchangeFrom}_balance`
      const sourceBalance = member[sourceBalanceKey as keyof typeof member] as number
      
      if (sourceBalance < amount) {
        toast({
          title: "Insufficient balance",
          description: `You need ${amount} ${exchangeFrom.replace('_', ' ')}(s) to make this exchange`,
          variant: "destructive"
        })
        return
      }

      // Calculate target amount
      const targetAmount = calculateExchange(amount, exchangeFrom, exchangeTo)

      if (targetAmount <= 0) {
        toast({
          title: "Invalid exchange",
          description: "The exchange would result in 0 balls. Try a larger amount.",
          variant: "destructive"
        })
        return
      }

      // Create withdrawal transaction
      const { error: withdrawError } = await supabase
        .from('pokeball_transactions')
        .insert({
          member_id: memberId,
          family_id: member.family_id,
          ball_type: exchangeFrom,
          amount: -amount,
          reason: `Exchanged to ${targetAmount} ${exchangeTo.replace('_', ' ')}(s)`,
          details: {
            exchange_type: 'withdrawal',
            target_type: exchangeTo,
            target_amount: targetAmount
          }
        })
        .select()
        .single()

      if (withdrawError) {
        console.error('Withdraw transaction error:', withdrawError)
        throw new Error(`Failed to process withdrawal: ${withdrawError.message}`)
      }

      // Create deposit transaction
      const { error: depositError } = await supabase
        .from('pokeball_transactions')
        .insert({
          member_id: memberId,
          family_id: member.family_id,
          ball_type: exchangeTo,
          amount: targetAmount,
          reason: `Exchanged from ${amount} ${exchangeFrom.replace('_', ' ')}(s)`,
          details: {
            exchange_type: 'deposit',
            source_type: exchangeFrom,
            source_amount: amount
          }
        })
        .select()
        .single()

      if (depositError) {
        console.error('Deposit transaction error:', depositError)
        throw new Error(`Failed to process deposit: ${depositError.message}`)
      }

      toast({
        title: "Exchange successful!",
        description: `Exchanged ${amount} ${exchangeFrom.replace('_', ' ')}(s) for ${targetAmount} ${exchangeTo.replace('_', ' ')}(s)`,
      })

      setExchangeAmount('')
      loadFamilyMembers() // Refresh balances
      if (selectedMember) {
        loadTransactions(selectedMember) // Refresh transaction history
      }
      
    } catch (error: any) {
      console.error('Exchange error:', error)
      toast({
        title: "Exchange failed",
        description: error.message || "An unexpected error occurred during the exchange",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFamilyMembers()
  }, [])

  const loadFamilyMembers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('family_members')
      .select('id, family_id, display_name, avatar_url, pokeball_balance, great_ball_balance, ultra_ball_balance, master_ball_balance')
      .order('display_name')

    if (error) {
      console.error('Error loading family members:', error)
      return
    }

    setFamilyMembers(data || [])
  }

  const loadTransactions = async (memberId?: string) => {
    const supabase = createClient()
    let query = supabase
      .from('pokeball_transactions')
      .select(`
        id,
        member_id,
        ball_type,
        amount,
        reason,
        created_at,
        details,
        member:member_id (
          display_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(25)

    // If memberId is provided, filter for that member only
    if (memberId) {
      query = query.eq('member_id', memberId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading transactions:', error)
      return
    }

    if (data) {
      const formattedTransactions: Transaction[] = data.map(tx => {
        const member = Array.isArray(tx.member) ? tx.member[0] : tx.member
        return {
          id: tx.id,
          member_id: tx.member_id,
          ball_type: tx.ball_type as BallType,
          amount: tx.amount,
          reason: tx.reason,
          created_at: tx.created_at,
          details: tx.details,
          member: {
            display_name: member?.display_name || 'Unknown'
          }
        }
      })
      setTransactions(formattedTransactions)
    }
  }

  const handleTransfer = async (fromMemberId: string, toMemberId: string) => {
    try {
      if (!fromMemberId || !toMemberId) {
        toast({
          title: "Invalid selection",
          description: "Please select both source and target members",
          variant: "destructive"
        })
        return
      }

      setIsLoading(true)
      const amount = parseInt(transferAmount)
      
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid number greater than 0",
          variant: "destructive"
        })
        return
      }

      const supabase = createClient()

      // First, verify both members exist and get their data
      const { data: fromMember, error: fromError } = await supabase
        .from('family_members')
        .select('id, family_id, display_name')
        .eq('id', fromMemberId)
        .single()

      const { data: toMember, error: toError } = await supabase
        .from('family_members')
        .select('id, family_id, display_name')
        .eq('id', toMemberId)
        .single()

      if (fromError || toError) {
        console.error('Member fetch error:', { fromError, toError })
        throw new Error('Failed to fetch member data')
      }

      if (!fromMember || !toMember) {
        throw new Error('One or more members not found')
      }

      // Verify members are in the same family
      if (fromMember.family_id !== toMember.family_id) {
        throw new Error('Members must be in the same family')
      }

      // Create withdrawal transaction
      const { error: withdrawError } = await supabase
        .from('pokeball_transactions')
        .insert({
          member_id: fromMemberId,
          family_id: fromMember.family_id,
          ball_type: selectedBallType,
          amount: -amount,
          reason: `Transfer to ${toMember.display_name}`,
          details: {
            transfer_type: 'withdrawal',
            to_member: toMemberId
          }
        })
        .select()
        .single()

      if (withdrawError) {
        console.error('Withdraw error:', withdrawError)
        throw new Error(`Failed to process withdrawal: ${withdrawError.message}`)
      }

      // Create deposit transaction
      const { error: depositError } = await supabase
        .from('pokeball_transactions')
        .insert({
          member_id: toMemberId,
          family_id: toMember.family_id,
          ball_type: selectedBallType,
          amount: amount,
          reason: `Transfer from ${fromMember.display_name}`,
          details: {
            transfer_type: 'deposit',
            from_member: fromMemberId
          }
        })
        .select()
        .single()

      if (depositError) {
        console.error('Deposit error:', depositError)
        throw new Error(`Failed to process deposit: ${depositError.message}`)
      }

      toast({
        title: "Transfer successful!",
        description: `Transferred ${amount} ${selectedBallType.replace('_', ' ')}(s) from ${fromMember.display_name} to ${toMember.display_name}`,
      })

      setTransferAmount('')
      setSelectedBallType('poke_ball')
      setSelectedMember(null)
      setTargetMember(null)
      loadFamilyMembers() // Refresh balances
      loadTransactions() // Refresh transaction history
      
    } catch (error: any) {
      console.error('Transfer error:', error)
      toast({
        title: "Transfer failed",
        description: error.message || "Failed to complete transfer",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Tabs defaultValue="balances" className="space-y-4">
      <TabsList>
        <TabsTrigger value="balances" className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Balances
        </TabsTrigger>
        <TabsTrigger value="transfers" className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4" />
          Transfers
        </TabsTrigger>
        <TabsTrigger value="exchange" className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4" />
          Exchange
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="w-4 h-4" />
          History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="balances">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Poké Bank Manager</CardTitle>
              <CardDescription>View and manage family members' Pokéball balances</CardDescription>
            </div>
            <RefreshButton onRefresh={loadFamilyMembers} />
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
                {familyMembers.map((member) => {
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
                        <div className="flex items-center gap-2">
                          <PokeBallActions memberId={member.id} familyId={member.family_id} onSuccess={loadFamilyMembers} />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(member.id)
                                  loadTransactions(member.id)
                                }}
                              >
                                View History
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Transaction History - {member.display_name}</DialogTitle>
                                <DialogDescription>Recent Pokéball transactions</DialogDescription>
                              </DialogHeader>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Reason</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                      <TableCell>{format(new Date(tx.created_at), 'MMM d, yyyy')}</TableCell>
                                      <TableCell>{tx.ball_type.replace('_', ' ')}</TableCell>
                                      <TableCell className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                      </TableCell>
                                      <TableCell>{tx.reason}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transfers">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Pokéballs</CardTitle>
            <CardDescription>Transfer Pokéballs between family members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Member</label>
                  <Select 
                    value={selectedMember || ''} 
                    onValueChange={(value) => setSelectedMember(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Member</label>
                  <Select 
                    value={targetMember || ''} 
                    onValueChange={(value) => setTargetMember(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers
                        .filter(m => m.id !== selectedMember)
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.display_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ball Type</label>
                  <Select 
                    value={selectedBallType} 
                    onValueChange={(value: string) => {
                      if (value === 'poke_ball' || value === 'great_ball' || value === 'ultra_ball' || value === 'master_ball') {
                        setSelectedBallType(value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ball type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poke_ball">Poké Ball</SelectItem>
                      <SelectItem value="great_ball">Great Ball</SelectItem>
                      <SelectItem value="ultra_ball">Ultra Ball</SelectItem>
                      <SelectItem value="master_ball">Master Ball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    min="1"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleTransfer(selectedMember!, targetMember!)} 
              disabled={!selectedMember || !targetMember || !transferAmount || isLoading}
            >
              Transfer Pokéballs
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="exchange">
        <Card>
          <CardHeader>
            <CardTitle>Exchange Pokéballs</CardTitle>
            <CardDescription>Convert between different types of Pokéballs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Member</label>
                  <Select onValueChange={(value) => setSelectedMember(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    value={exchangeAmount}
                    onChange={(e) => setExchangeAmount(e.target.value)}
                    min="1"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From</label>
                  <Select 
                    value={exchangeFrom} 
                    onValueChange={(value: string) => {
                      if (value === 'poke_ball' || value === 'great_ball' || value === 'ultra_ball' || value === 'master_ball') {
                        setExchangeFrom(value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poke_ball">Poké Ball (×1)</SelectItem>
                      <SelectItem value="great_ball">Great Ball (×10)</SelectItem>
                      <SelectItem value="ultra_ball">Ultra Ball (×50)</SelectItem>
                      <SelectItem value="master_ball">Master Ball (×100)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <Select 
                    value={exchangeTo} 
                    onValueChange={(value: string) => {
                      if (value === 'poke_ball' || value === 'great_ball' || value === 'ultra_ball' || value === 'master_ball') {
                        setExchangeTo(value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poke_ball">Poké Ball (×1)</SelectItem>
                      <SelectItem value="great_ball">Great Ball (×10)</SelectItem>
                      <SelectItem value="ultra_ball">Ultra Ball (×50)</SelectItem>
                      <SelectItem value="master_ball">Master Ball (×100)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {exchangeAmount && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">
                    Exchange Rate: {exchangeAmount} {exchangeFrom.replace('_', ' ')}(s) = {' '}
                    {calculateExchange(parseInt(exchangeAmount) || 0, exchangeFrom, exchangeTo)}{' '}
                    {exchangeTo.replace('_', ' ')}(s)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleExchange(selectedMember!)} 
              disabled={!selectedMember || !exchangeAmount || isLoading}
            >
              Exchange Pokéballs
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="history">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View all Pokéball transactions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={selectedMember || 'all'} 
                onValueChange={(value) => {
                  setSelectedMember(value === 'all' ? null : value)
                  loadTransactions(value === 'all' ? undefined : value)
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  {familyMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <RefreshButton onRefresh={() => loadTransactions(selectedMember || undefined)} />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell>{tx.member.display_name}</TableCell>
                    <TableCell>{tx.ball_type.replace('_', ' ')}</TableCell>
                    <TableCell className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </TableCell>
                    <TableCell>{tx.reason}</TableCell>
                    <TableCell>
                      {tx.details && (
                        <span className="text-sm text-muted-foreground">
                          {tx.details.exchange_type && `${tx.details.exchange_type} exchange`}
                          {tx.details.transfer_type && `${tx.details.transfer_type} transfer`}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
} 