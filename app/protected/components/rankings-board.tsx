'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Trophy, Star, Activity } from "lucide-react"
import type { DashboardMember } from "@/types/dashboard"

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      when: "beforeChildren",
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

interface RankingsBoardProps {
  members: DashboardMember[]
  gymRank: string
}

export function RankingsBoard({ members, gymRank }: RankingsBoardProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-primary">
                Family Rankings
              </CardTitle>
              <CardDescription>
                Track achievements and compete for top positions
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-primary">
              Family Rank: {gymRank}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="grid gap-6 md:grid-cols-2"
            variants={containerVariants}
          >
            {/* Weekly Top Performers */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Weekly Top Performers</CardTitle>
                  <CardDescription>Based on tasks completed this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="space-y-4"
                    variants={containerVariants}
                  >
                    {members.slice(0, 3).map((member, index) => (
                      <motion.div
                        key={member.id}
                        variants={itemVariants}
                        className="flex items-center justify-between p-2 rounded-lg glass-effect"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            index === 0 && "bg-pokemon-electric/20 text-pokemon-electric",
                            index === 1 && "bg-pokemon-steel/20 text-pokemon-steel",
                            index === 2 && "bg-pokemon-ground/20 text-pokemon-ground"
                          )}>
                            {index + 1}
                          </div>
                          <span className="font-medium">{member.displayName}</span>
                        </div>
                        <Badge variant="outline" className="text-primary">
                          {Math.floor(Math.random() * 10)} tasks
                        </Badge>
                      </motion.div>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievement Showcase */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Recent Achievements</CardTitle>
                  <CardDescription>Latest family milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="space-y-4"
                    variants={containerVariants}
                  >
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between p-2 rounded-lg glass-effect"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-pokemon-electric" />
                        <span>First Gym Badge</span>
                      </div>
                      <Badge variant="outline" className="text-primary">
                        Today
                      </Badge>
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between p-2 rounded-lg glass-effect"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-pokemon-psychic" />
                        <span>10 Pokémon Caught</span>
                      </div>
                      <Badge variant="outline" className="text-primary">
                        Yesterday
                      </Badge>
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between p-2 rounded-lg glass-effect"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-pokemon-grass" />
                        <span>50 Tasks Completed</span>
                      </div>
                      <Badge variant="outline" className="text-primary">
                        This Week
                      </Badge>
                    </motion.div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 