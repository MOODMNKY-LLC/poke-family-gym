"use client"
import { useState, useEffect } from "react"
import { signInAction } from "@/app/actions"
import { FormMessage, Message } from "@/components/form-message"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { motion } from "framer-motion"
import InteractiveHoverButton from "@/components/ui/interactive-hover-button"

export default function Login({ searchParams }: { searchParams: Promise<Message> }) {
  const [message, setMessage] = useState<Message | null>(null)

  useEffect(() => {
    async function fetchMessage() {
      const params = await searchParams
      setMessage(params)
    }
    fetchMessage()
  }, [searchParams])

  return (
    <GlassCard className="w-full p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link className="text-primary hover:text-primary/80 font-medium underline" href="/sign-up">
              Sign up
            </Link>
          </p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input name="email" placeholder="you@example.com" required />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <Link
                className="text-xs text-muted-foreground hover:text-foreground underline"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              required
            />
          </div>

          <div className="flex justify-end">
            <InteractiveHoverButton text="Sign in" formAction={signInAction} />
          </div>
          
          <FormMessage message={message} />
        </form>
      </motion.div>
    </GlassCard>
  )
}
