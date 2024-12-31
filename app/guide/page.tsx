"use client"

import { PokeBall } from "@/components/icons/pokeball"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useState } from "react"
import Link from "next/link"
import { 
  Trophy, 
  Users, 
  Star,
  ArrowRight,
  Book,
  Gamepad,
  Sword,
  Shield,
  Heart,
  Award,
  Gift,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Guide sections data
const guideSections = [
  {
    title: "Getting Started",
    icon: Star,
    items: [
      {
        title: "Creating Your Account",
        content: "Learn how to create your Family Gym account and set up your trainer profile."
      },
      {
        title: "Choosing Your Starter Pokémon",
        content: "Guide to selecting and bonding with your first Pokémon partner."
      },
      {
        title: "Understanding the Basics",
        content: "Essential information about tasks, rewards, and family interactions."
      }
    ]
  },
  {
    title: "Tasks & Rewards",
    icon: Trophy,
    items: [
      {
        title: "Daily Tasks",
        content: "How to view, complete, and track your daily tasks and achievements."
      },
      {
        title: "Earning Poké Balls",
        content: "Learn about the reward system and how to earn Poké Balls."
      },
      {
        title: "Special Challenges",
        content: "Information about special events and bonus challenges."
      }
    ]
  },
  {
    title: "Family Features",
    icon: Users,
    items: [
      {
        title: "Family Roles",
        content: "Understanding different family member roles and permissions."
      },
      {
        title: "Team Activities",
        content: "Guide to collaborative tasks and family achievements."
      },
      {
        title: "Communication Tools",
        content: "How to use chat and notification features effectively."
      }
    ]
  }
]

const features = [
  {
    title: "Task Management",
    icon: Gamepad,
    description: "Turn daily tasks into exciting Pokémon adventures!"
  },
  {
    title: "Battle System",
    icon: Sword,
    description: "Challenge family members to friendly task battles."
  },
  {
    title: "Defense Mechanics",
    icon: Shield,
    description: "Protect your progress and maintain your streaks."
  },
  {
    title: "Team Bonding",
    icon: Heart,
    description: "Build stronger family connections through shared activities."
  }
]

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState("overview")

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
              Trainer's Guide • Master Your Family Gym Journey
            </Badge>
            <h1 className="text-4xl font-bold tracking-tighter">
              Family Gym Guide
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about managing your Family Gym, earning rewards, and growing together!
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-12">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Book className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Star className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <Award className="h-4 w-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {guideSections.map((section, index) => (
              <Card key={section.title} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item, itemIndex) => (
                    <AccordionItem key={itemIndex} value={`item-${itemIndex}`}>
                      <AccordionTrigger>{item.title}</AccordionTrigger>
                      <AccordionContent>
                        {item.content}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="features" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faq" className="space-y-8">
            <Card className="p-6">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    How do I earn Poké Balls?
                  </AccordionTrigger>
                  <AccordionContent>
                    Complete daily tasks, maintain streaks, and participate in family challenges to earn Poké Balls. The more consistent you are, the more rewards you'll receive!
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    What are Family Badges?
                  </AccordionTrigger>
                  <AccordionContent>
                    Family Badges are special achievements earned by completing family milestones together. They represent your family's growth and accomplishments.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    Can I change my starter Pokémon?
                  </AccordionTrigger>
                  <AccordionContent>
                    While you can't change your starter Pokémon, you can earn and collect additional Pokémon through tasks and special events!
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* CTA Section */}
      <section className="container py-12">
        <Card className="p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <Badge className="mb-4" variant="outline">
              Ready to Start?
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter mb-4">
              Begin Your Family Adventure Today!
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Create your Family Gym, choose your starter Pokémon, and embark on an amazing journey together!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/sign-up">
                  Create Your Gym
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/trainers">
                  View Trainers
                  <Users className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
} 