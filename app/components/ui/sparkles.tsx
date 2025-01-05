'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SparkleProps {
  color: string
  size?: number
  style?: React.CSSProperties
}

interface SparklesProps {
  className?: string
  color: string
  count?: number
}

function Sparkle({ color, size = 4, style }: SparkleProps) {
  const path = `M${size},0
               A${size},${size} 0 0,1 ${size * 2},${size}
               A${size},${size} 0 0,1 ${size},${size * 2}
               A${size},${size} 0 0,1 0,${size}
               A${size},${size} 0 0,1 ${size},0
               Z`

  return (
    <motion.svg
      style={style}
      width={size * 2}
      height={size * 2}
      viewBox={`0 0 ${size * 2} ${size * 2}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0, rotate: 0 }}
      animate={{
        scale: [0, 1, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
        times: [0, 0.5, 1],
        repeat: Infinity,
        repeatDelay: Math.random() * 2
      }}
    >
      <path d={path} fill={color} />
    </motion.svg>
  )
}

export function Sparkles({ className, color, count = 8 }: SparklesProps) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([])

  useEffect(() => {
    const newSparkles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }))
    setSparkles(newSparkles)
  }, [count])

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <AnimatePresence>
        {sparkles.map(sparkle => (
          <Sparkle
            key={sparkle.id}
            color={color}
            style={{
              position: 'absolute',
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
} 