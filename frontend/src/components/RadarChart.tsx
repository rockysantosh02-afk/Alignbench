'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface RadarChartSeries {
  name: string
  color: string
  values: number[]
}

export interface RadarChartProps {
  dimensions: string[]
  series: RadarChartSeries[]
  maxValue?: number
  className?: string
  size?: number
  showLegend?: boolean
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180.0)
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function getPolygonPath(
  centerX: number,
  centerY: number,
  radius: number,
  values: number[],
  maxValue: number,
  dimensionsCount: number
): string {
  const points = values.map((value, i) => {
    const angle = (360 / dimensionsCount) * i
    const normalizedRadius = (value / maxValue) * radius
    return polarToCartesian(centerX, centerY, normalizedRadius, angle)
  })

  return points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ') + ' Z'
}

export function RadarChart({
  dimensions,
  series,
  maxValue = 5,
  className,
  size = 320,
  showLegend = true,
}: RadarChartProps) {
  const [mounted, setMounted] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const center = size / 2
  const radius = size / 2 - 30

  // Calculate polygon paths
  const polygons = useMemo(() => {
    return series.map((s) => ({
      ...s,
      path: getPolygonPath(center, center, radius, s.values, maxValue, dimensions.length),
    }))
  }, [series, center, radius, maxValue, dimensions.length])

  if (!mounted) {
    return (
      <div className={cn('flex justify-center', className)} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="text-muted">
          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((level) => (
            <polygon
              key={level}
              points={dimensions
                .map((_, i) => {
                  const angle = (360 / dimensions.length) * i
                  const r = radius * level
                  const p = polarToCartesian(center, center, r, angle)
                  return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
                })
                .join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}
          {/* Axes */}
          {dimensions.map((_, i) => {
            const angle = (360 / dimensions.length) * i
            const p = polarToCartesian(center, center, radius, angle)
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={p.x}
                y2={p.y}
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.3"
              />
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center', className)} style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="text-muted">
        {/* Grid polygons */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((level) => (
          <polygon
            key={level}
            points={dimensions
              .map((_, i) => {
                const angle = (360 / dimensions.length) * i
                const r = radius * level
                const p = polarToCartesian(center, center, r, angle)
                return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
              })
              .join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}

        {/* Axes */}
        {dimensions.map((_, i) => {
          const angle = (360 / dimensions.length) * i
          const p = polarToCartesian(center, center, radius, angle)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.3"
            />
          )
        })}

        {/* Dimension labels */}
        {dimensions.map((dimension, i) => {
          const angle = (360 / dimensions.length) * i
          const labelRadius = radius + 20
          const p = polarToCartesian(center, center, labelRadius, angle)
          const textAnchor =
            angle === 0 || angle === 180
              ? 'middle'
              : angle > 0 && angle < 180
              ? 'start'
              : 'end'
          return (
            <text
              key={i}
              x={p.x}
              y={p.y + 4}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              fontSize="11"
              fill="currentColor"
              className="font-medium"
            >
              {dimension.replace(/_/g, ' ')}
            </text>
          )
        })}

        {/* Value labels on first axis */}
        {[1, 2, 3, 4, 5].map((val) => {
          const r = (val / maxValue) * radius
          const p = polarToCartesian(center, center, r, -90)
          return (
            <text
              key={val}
              x={p.x - 5}
              y={p.y + 4}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="9"
              fill="currentColor"
              opacity="0.5"
              className="font-mono-score"
            >
              {val}
            </text>
          )
        })}

        {/* Polygons */}
        {polygons.map((polygon) => (
          <motion.path
            key={polygon.name}
            d={polygon.path}
            fill={polygon.color}
            fillOpacity={0.15}
            stroke={polygon.color}
            strokeWidth={2}
            strokeLinejoin="round"
            initial={reducedMotion ? { opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeOut' }}
          />
        ))}

        {/* Data points */}
        {polygons.flatMap((polygon, seriesIndex) =>
          polygon.values.map((value, dimIndex) => {
            const angle = (360 / dimensions.length) * dimIndex
            const normalizedRadius = (value / maxValue) * radius
            const p = polarToCartesian(center, center, normalizedRadius, angle)
            return (
              <motion.circle
                key={`${seriesIndex}-${dimIndex}`}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={polygon.color}
                stroke="#18181b"
                strokeWidth={1}
                initial={reducedMotion ? { scale: 1 } : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: reducedMotion ? 0 : 0.4 + dimIndex * 0.03, type: 'spring' }}
              />
            )
          })
        )}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-sm font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}