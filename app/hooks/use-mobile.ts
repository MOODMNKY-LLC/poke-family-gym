"use client"

import { useState, useEffect } from "react"

export const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    // Use matchMedia for better performance and accuracy
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => setIsMobile(mql.matches)
    
    // Initial check
    setIsMobile(mql.matches)
    
    // Add listener
    mql.addEventListener("change", onChange)
    
    // Cleanup
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile ?? false // Provide a default value while loading
} 