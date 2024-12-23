'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Trophy, Star, Target, Medal, CheckCircle2 } from 'lucide-react'

interface GymChallengeStep {
  id: string
  title: string
  description: string
  requiredCount: number
  currentCount: number
  isCompleted: boolean
}

interface GymChallenge {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  reward: {
    type: string
    amount: number
    description: string
  }
  steps: GymChallengeStep[]
  progress: number
}

interface GymChallengeProps {
  challenge: GymChallenge
  onClaimReward?: () => Promise<void>
}

const stepIcons = {
  tasks: CheckCircle2,
  synergy: Star,
  progress: Target,
  achievement: Medal,
  completion: Trophy
}

export function GymChallenge({ challenge, onClaimReward }: GymChallengeProps) {
  const [isClaimingReward, setIsClaimingReward] = useState(false)
  const allStepsCompleted = challenge.steps.every(step => step.isCompleted)

  const handleClaimReward = async () => {
    if (!onClaimReward) return
    
    try {
      setIsClaimingReward(true)
      await onClaimReward()
    } finally {
      setIsClaimingReward(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{challenge.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Challenge Description and Progress */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {challenge.description}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{challenge.progress}%</span>
              </div>
              <Progress value={challenge.progress} className="h-2" />
            </div>
          </div>

          {/* Challenge Steps */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {challenge.steps.map((step, index) => {
                const Icon = stepIcons[step.id.split('-')[0] as keyof typeof stepIcons] || CheckCircle2
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border",
                      step.isCompleted ? "bg-green-500/10 border-green-500/20" : "bg-background"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "rounded-full p-2",
                        step.isCompleted ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{step.title}</h4>
                          <span className="text-sm text-muted-foreground">
                            {step.currentCount}/{step.requiredCount}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                        <Progress 
                          value={(step.currentCount / step.requiredCount) * 100} 
                          className="h-1.5" 
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Challenge Reward */}
          <div className="space-y-4">
            <h4 className="font-medium">Reward</h4>
            <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-4">
                <div className="rounded-full p-2 bg-yellow-500/20 text-yellow-500">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{challenge.reward.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {challenge.reward.amount} {challenge.reward.type}
                  </p>
                </div>
              </div>
              {allStepsCompleted && onClaimReward && (
                <Button
                  onClick={handleClaimReward}
                  disabled={isClaimingReward}
                  size="sm"
                >
                  {isClaimingReward ? "Claiming..." : "Claim Reward"}
                </Button>
              )}
            </div>
          </div>

          {/* Challenge Period */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Started {new Date(challenge.startDate).toLocaleDateString()}</span>
            <span>Ends {new Date(challenge.endDate).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 