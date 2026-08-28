'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { DisagreementCase } from '@/lib/mockData'

interface ScatterPlotProps {
  cases: readonly DisagreementCase[]
  selectedCaseId?: string
  onSelectCase: (c: DisagreementCase) => void
}

const DIMENSION_COLORS: Record<string, string> = {
  helpfulness: '#6366f1',           // Indigo
  honesty: '#ec4899',               // Pink
  instruction_following: '#3b82f6', // Blue
  reasoning: '#10b981',             // Emerald
  creativity: '#8b5cf6',            // Violet
  safety: '#ef4444',                // Red
  coherence: '#14b8a6',             // Teal
  conciseness: '#f59e0b',           // Amber
  tone: '#06b6d4',                  // Cyan
  depth: '#a855f7',                 // Purple
}

const DEFAULT_COLOR = '#a1a1aa'

export function ScatterPlot({ cases, selectedCaseId, onSelectCase }: ScatterPlotProps) {
  const shouldReduceMotion = useReducedMotion()
  // SVG Dimensions
  const width = 500
  const height = 500
  const margin = { top: 30, right: 30, bottom: 50, left: 50 }
  
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Helper functions for scaling
  const getX = (val: number) => margin.left + (val / 5) * chartWidth
  const getY = (val: number) => margin.top + chartHeight - (val / 5) * chartHeight

  // Grid tick values (1 to 5)
  const ticks = [1, 2, 3, 4, 5]

  // Dimension color mapping helper
  const getColor = (dimension: string) => {
    return DIMENSION_COLORS[dimension.toLowerCase()] || DEFAULT_COLOR
  }

  // Count disagreement cases
  const highDisagreementCount = useMemo(() => {
    return cases.filter(c => Math.abs(c.heuristicScore - c.judgeScore) >= 1.5).length
  }, [cases])

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 w-full">
      {/* Hand-built SVG Chart */}
      <div className="relative bg-[#0d0d0e] border border-border rounded-xl p-4 shadow-xl flex-1 flex justify-center items-center">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="max-w-[450px] aspect-square overflow-visible"
        >
          {/* Grid lines & ticks */}
          {ticks.map((tick) => {
            const x = getX(tick)
            const y = getY(tick)

            return (
              <g key={tick} className="text-zinc-800 dark:text-zinc-800">
                {/* Vertical grid line */}
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + chartHeight}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.3}
                />
                {/* Horizontal grid line */}
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + chartWidth}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.3}
                />
                {/* X-axis tick label */}
                <text
                  x={x}
                  y={margin.top + chartHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  className="fill-zinc-400 font-mono-score font-medium"
                >
                  {tick}
                </text>
                {/* Y-axis tick label */}
                <text
                  x={margin.left - 15}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  className="fill-zinc-400 font-mono-score font-medium"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* Core Axes */}
          {/* Y-Axis */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + chartHeight}
            stroke="#27272a"
            strokeWidth={1.5}
          />
          {/* X-Axis */}
          <line
            x1={margin.left}
            y1={margin.top + chartHeight}
            x2={margin.left + chartWidth}
            y2={margin.top + chartHeight}
            stroke="#27272a"
            strokeWidth={1.5}
          />

          {/* Faint Diagonal Reference Line (x = y) */}
          <line
            x1={getX(0)}
            y1={getY(0)}
            x2={getX(5)}
            y2={getY(5)}
            stroke="#3f3f46"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            className="opacity-40"
          />

          {/* Axis Labels */}
          {/* X-axis label */}
          <text
            x={margin.left + chartWidth / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="12"
            className="fill-zinc-300 font-medium tracking-wide uppercase"
          >
            Heuristic Score (Auto)
          </text>
          {/* Y-axis label */}
          <text
            transform={`rotate(-90) translate(-${margin.top + chartHeight / 2}, 18)`}
            textAnchor="middle"
            fontSize="12"
            className="fill-zinc-300 font-medium tracking-wide uppercase"
          >
            Judge Score (Human/LLM)
          </text>

          {/* Data Points */}
          {cases.map((c) => {
            const cx = getX(c.heuristicScore)
            const cy = getY(c.judgeScore)
            const color = getColor(c.dimension)
            const isHighDisagreement = Math.abs(c.heuristicScore - c.judgeScore) >= 1.5
            const isSelected = selectedCaseId === c.id

            return (
              <g key={c.id} className="group outline-none">
                {/* Subtle Breathing Glow for High Disagreement */}
                {isHighDisagreement && (
                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r={9}
                    fill={color}
                    initial={{ opacity: 0.15, scale: 1 }}
                    animate={
                      shouldReduceMotion
                        ? { opacity: 0.3, scale: 1.1 }
                        : {
                            opacity: [0.15, 0.45, 0.15],
                            scale: [1, 1.6, 1],
                          }
                    }
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : {
                            repeat: Infinity,
                            duration: 3,
                            ease: 'easeInOut',
                          }
                    }
                    pointerEvents="none"
                  />
                )}

                {/* Selected highlight ring */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={10}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    className={shouldReduceMotion ? "" : "animate-pulse"}
                  />
                )}

                {/* Main Data Point */}
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 6 : 5}
                  fill={color}
                  stroke={isSelected ? '#ffffff' : '#18181b'}
                  strokeWidth={isSelected ? 1.5 : 1}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.5 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 20 }}
                  className="cursor-pointer"
                  onClick={() => onSelectCase(c)}
                />

                {/* Invisible larger interactive trigger for easier clicking / Keyboard focus */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={14}
                  fill="transparent"
                  className="cursor-pointer focus:outline-none focus:stroke-white/50 focus:stroke-2"
                  tabIndex={0}
                  role="button"
                  aria-label={`Case ${c.id}: ${c.dimension}. Heuristic score ${c.heuristicScore}, Judge score ${c.judgeScore}`}
                  onClick={() => onSelectCase(c)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectCase(c)
                    }
                  }}
                >
                  <title>{`${c.id} (${c.dimension})
Heuristic: ${c.heuristicScore}
Judge: ${c.judgeScore}`}</title>
                </circle>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend & Stats Panel */}
      <div className="flex flex-col gap-6 w-full md:w-64 bg-[#18181b]/50 border border-border p-5 rounded-xl">
        <div>
          <h4 className="text-sm font-semibold text-zinc-300 mb-3">Dimensions Map</h4>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
            {Object.entries(DIMENSION_COLORS).map(([dim, color]) => (
              <div key={dim} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize text-zinc-400 truncate">{dim.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">Explorer Insights</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Total Cases</span>
              <span className="font-mono font-bold text-zinc-200">{cases.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">High Disagreement</span>
              <span className="flex items-center gap-1.5 font-bold text-amber-500 font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                {highDisagreementCount} ({((highDisagreementCount / cases.length) * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 leading-relaxed">
              Points glowing in the plot indicate a score difference of &ge; 1.5. Click any point to inspect the prompt &amp; responses.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
