'use client'

import { useState, useEffect } from 'react'

interface TypewriterProps {
  text: string
  speed?: number // Milliseconds per character
}

export function Typewriter({ text, speed = 15 }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)

  // Reset typewriter state whenever the text changes
  useEffect(() => {
    setDisplayedText('')
    setCurrentIndex(0)
  }, [text])

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setShouldReduceMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Timer loop for characters streaming
  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedText(text)
      setCurrentIndex(text.length)
      return
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)
      return () => clearTimeout(timer)
    }
  }, [text, currentIndex, speed, shouldReduceMotion])

  // Instantly reveal all text when user clicks
  const handleSkip = () => {
    if (currentIndex < text.length) {
      setDisplayedText(text)
      setCurrentIndex(text.length)
    }
  }

  const isComplete = currentIndex >= text.length

  return (
    <div
      onClick={handleSkip}
      title={!isComplete ? "Click to instantly reveal" : undefined}
      className={`relative p-4 bg-muted rounded-lg border border-border text-sm text-zinc-300 leading-relaxed font-sans cursor-pointer transition-all duration-200 select-none group ${
        !isComplete ? 'hover:border-zinc-500' : ''
      }`}
    >
      <span>{displayedText}</span>
      {!isComplete && (
        <>
          <span className="inline-block w-1.5 h-4 bg-accent/80 ml-1 align-middle animate-pulse" />
          <div className="absolute right-3 bottom-2 text-[10px] text-zinc-500 font-medium tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Click to Skip
          </div>
        </>
      )}
    </div>
  )
}
