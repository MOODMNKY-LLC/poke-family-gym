'use client'

import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Dumbbell, Home, Settings, Users } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function CongratulationsPage() {
  const router = useRouter()
  const supabase = createClient()

  // Check if user is authenticated and has a profile
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      // Check if profile exists
      const { data: profile } = await supabase
        .from('family_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        router.push('/sign-up')
      }
    }

    checkAuth()
  }, [router, supabase])

  return (
    <GlassCard className="w-full p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="space-y-4 text-center">
          <motion.h1 
            className="text-4xl font-bold text-primary"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            Welcome to Your Family Gym!
          </motion.h1>
          <p className="text-muted-foreground">
            Your account has been verified and your family gym is ready. Where would you like to go?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/protected" className="contents">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="outline" 
                className="w-full h-auto py-8 flex flex-col items-center gap-4 glass-effect"
              >
                <Home className="h-8 w-8" />
                <div className="space-y-1 text-center">
                  <h3 className="font-semibold">Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    View your family gym dashboard
                  </p>
                </div>
              </Button>
            </motion.div>
          </Link>

          <Link href="/protected/trainers" className="contents">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="outline" 
                className="w-full h-auto py-8 flex flex-col items-center gap-4 glass-effect"
              >
                <Users className="h-8 w-8" />
                <div className="space-y-1 text-center">
                  <h3 className="font-semibold">Family Members</h3>
                  <p className="text-sm text-muted-foreground">
                    Add and manage family members
                  </p>
                </div>
              </Button>
            </motion.div>
          </Link>

          <Link href="/protected/gym" className="contents">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="outline" 
                className="w-full h-auto py-8 flex flex-col items-center gap-4 glass-effect"
              >
                <Dumbbell className="h-8 w-8" />
                <div className="space-y-1 text-center">
                  <h3 className="font-semibold">Gym Activities</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up tasks and rewards
                  </p>
                </div>
              </Button>
            </motion.div>
          </Link>

          <Link href="/account" className="contents">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="outline" 
                className="w-full h-auto py-8 flex flex-col items-center gap-4 glass-effect"
              >
                <Settings className="h-8 w-8" />
                <div className="space-y-1 text-center">
                  <h3 className="font-semibold">Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize your family gym
                  </p>
                </div>
              </Button>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </GlassCard>
  )
} 