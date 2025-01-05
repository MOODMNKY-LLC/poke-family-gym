'use client'

import { useEffect, useRef, useState } from 'react'

type SoundType = 'hover' | 'purchase' | 'open' | 'rare'

const createAudioContext = () => {
  if (typeof window === 'undefined') return null
  return new (window.AudioContext || (window as any).webkitAudioContext)()
}

const generateSound = (ctx: AudioContext, type: SoundType): void => {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  
  // Configure sound based on type
  switch (type) {
    case 'hover': {
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.1)
      break
    }
      
    case 'purchase': {
      oscillator.frequency.setValueAtTime(440, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
      break
    }
      
    case 'open': {
      oscillator.frequency.setValueAtTime(1760, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.2)
      break
    }
      
    case 'rare': {
      oscillator.frequency.setValueAtTime(1760, ctx.currentTime)
      const delay = ctx.createDelay()
      delay.delayTime.setValueAtTime(0.1, ctx.currentTime)
      const feedback = ctx.createGain()
      feedback.gain.setValueAtTime(0.4, ctx.currentTime)
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
      
      oscillator.connect(gainNode)
      gainNode.connect(delay)
      delay.connect(feedback)
      feedback.connect(delay)
      delay.connect(ctx.destination)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)
      break
    }
  }
  
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)
}

export function useSound(type: SoundType) {
  const contextRef = useRef<AudioContext | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && !contextRef.current) {
        contextRef.current = createAudioContext()
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
      setIsSupported(false)
    }
  }, [])

  const play = () => {
    if (!isSupported || !contextRef.current) return

    try {
      generateSound(contextRef.current, type)
    } catch (error) {
      console.warn('Error playing sound:', error)
      setIsSupported(false)
    }
  }

  return { play, isSupported }
} 