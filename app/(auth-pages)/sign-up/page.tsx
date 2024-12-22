"use client"
import { useState } from "react"
import { signUpAction } from "@/app/actions"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StarterSelection } from "@/components/pokemon/starter-selection"
import { FormMessage } from "@/components/form-message"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import InteractiveHoverButton from "@/components/ui/interactive-hover-button"

export default function Signup() {
  const [step, setStep] = useState(1)
  const [starterFormId, setStarterFormId] = useState<number | null>(null)
  const [starterNickname, setStarterNickname] = useState<string>("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    familyName: "",
    pin: ""
  })

  const handleNext = () => {
    if (step === 1 && (!formData.email || !formData.password || !formData.familyName)) {
      toast.error("Please fill out all fields.")
      return
    }
    if (step === 3 && formData.pin.length !== 6) {
      toast.error("Please enter a 6-digit PIN.")
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => setStep(step - 1)

  const handleSubmit = async () => {
    if (!starterFormId || !starterNickname) {
      toast.error("Please select a starter Pokémon and provide a nickname.")
      return
    }
    try {
      const data = new FormData()
      data.append('email', formData.email)
      data.append('password', formData.password)
      data.append('family_name', formData.familyName)
      data.append('starter_pokemon_form_id', starterFormId.toString())
      data.append('starter_pokemon_nickname', starterNickname)
      data.append('pin', formData.pin)

      const response = await signUpAction(data)
      if (response.error) {
        toast.error(response.error.message)
      } else {
        toast.success("Sign up successful! Please check your email for a verification link.")
      }
    } catch (error) {
      toast.error("An error occurred during sign-up. Please try again.")
      console.error("Sign-up error:", error)
    }
  }

  return (
    <GlassCard className="w-full p-8">
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-3xl font-bold text-primary">Welcome to Your Pokémon Adventure!</h1>
          <p className="text-muted-foreground">Register your family gym and start your journey.</p>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Your password"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="family_name">Family Gym Name</Label>
            <Input
              name="family_name"
              value={formData.familyName}
              onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
              placeholder="The Ketchum Gym"
              minLength={2}
              required
            />
          </div>
          <div className="flex justify-end">
            <InteractiveHoverButton text="Next" onClick={handleNext} />
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-3xl font-bold text-primary">Choose Your Partner Pokémon</h1>
          <p className="text-muted-foreground">Select a Pokémon to start your adventure.</p>
          <StarterSelection
            onSelect={(formId, nickname) => {
              setStarterFormId(formId)
              setStarterNickname(nickname)
            }}
            selectedGeneration={1}
          />
          <div className="flex justify-between">
            <InteractiveHoverButton text="Back" onClick={handleBack} />
            <InteractiveHoverButton text="Next" onClick={handleNext} />
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-3xl font-bold text-primary">Set Your Admin PIN</h1>
          <p className="text-muted-foreground">
            Create a 6-digit PIN for your admin account. You can change this later in your profile.
          </p>
          <InputOTP
            value={formData.pin}
            onChange={(value) => setFormData({ ...formData, pin: value })}
            maxLength={6}
            containerClassName="group flex items-center justify-center"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="w-10 h-12 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <div className="flex justify-between">
            <InteractiveHoverButton text="Back" onClick={handleBack} />
            <InteractiveHoverButton text="Next" onClick={handleNext} />
          </div>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-3xl font-bold text-primary">Confirm and Sign Up</h1>
          <p className="text-muted-foreground">Review your information and click Sign Up to complete the process.</p>
          <div className="flex justify-between">
            <InteractiveHoverButton text="Back" onClick={handleBack} />
            <InteractiveHoverButton text="Sign Up" onClick={handleSubmit} />
          </div>
        </motion.div>
      )}

      <FormMessage message={{ message: "" }} />
    </GlassCard>
  )
}
