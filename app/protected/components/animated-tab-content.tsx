'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AnimatedTabContentProps {
  children: ReactNode
}

const contentVariants = {
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

export function AnimatedTabContent({ children }: AnimatedTabContentProps) {
  return (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
} 