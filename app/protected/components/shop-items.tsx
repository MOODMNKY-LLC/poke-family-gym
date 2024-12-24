'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

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
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
}

const shopItems = [
  {
    id: 'mystery-box',
    title: 'Mystery Box',
    description: 'Contains a random Pokémon',
    price: 50,
  },
  {
    id: 'rare-box',
    title: 'Rare Box',
    description: 'Higher chance of rare Pokémon',
    price: 100,
  },
  {
    id: 'evolution-stone',
    title: 'Evolution Stone',
    description: 'Evolve a compatible Pokémon',
    price: 200,
  }
]

export function ShopItems() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary">
            Poke Shop
          </CardTitle>
          <CardDescription>
            Spend your hard-earned Pokéballs on rewards and items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
          >
            {shopItems.map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-primary">
                        {item.price} Pokéballs
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={cn(
                          "transition-colors duration-200",
                          "hover:bg-primary/10 hover:text-primary"
                        )}
                      >
                        Purchase
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 