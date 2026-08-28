'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  format?: (val: number) => string
  className?: string
}

function StatCard({ label, value, format, className }: StatCardProps) {
  const [mounted, setMounted] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const count = useMotionValue(0)
  const springCount = useSpring(count, { stiffness: 100, damping: 15, mass: 0.5 })
  const [currentVal, setCurrentVal] = useState(0)

  useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString())
  const displayValue = format ? format(numericValue) : numericValue.toString()

  useEffect(() => {
    count.set(numericValue)
  }, [count, numericValue])

  useEffect(() => {
    return springCount.onChange((latest) => {
      setCurrentVal(latest)
    })
  }, [springCount])

  if (reducedMotion || !mounted) {
    return (
      <Card className={cn('flex-1 min-w-[160px]', className)}>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold font-mono-score mt-1">{displayValue}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('flex-1 min-w-[160px]', className)}>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold font-mono-score mt-1">
          {format ? format(currentVal) : currentVal.toFixed(numericValue % 1 !== 0 ? 2 : 0)}
        </p>
      </CardContent>
    </Card>
  )
}

interface StatRowProps {
  stats: Array<{
    label: string
    value: number | string
    format?: (val: number) => string
  }>
  className?: string
}

export function StatRow({ stats, className }: StatRowProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}