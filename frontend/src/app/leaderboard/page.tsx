'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronUp, ChevronDown, ArrowUpDown, RefreshCw, AlertTriangle } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface LeaderboardEntry {
  id: string
  name: string
  meanScore: number
  disagreementRate: number
  runCount: number
  dimensionScores: Record<string, number>
}

// Sub-component for rank badge that pulses when rank changes
function RankBadge({ rank, shouldReduceMotion }: { rank: number; shouldReduceMotion: boolean }) {
  const [prevRank, setPrevRank] = useState(rank)
  const [shouldPulse, setShouldPulse] = useState(false)

  useEffect(() => {
    if (rank !== prevRank) {
      setShouldPulse(true)
      setPrevRank(rank)
    }
  }, [rank, prevRank])

  return (
    <motion.div
      animate={shouldPulse && !shouldReduceMotion ? { scale: [1, 1.35, 1], color: ['#fafafa', '#f59e0b', '#fafafa'] } : {}}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      onAnimationComplete={() => setShouldPulse(false)}
      className="inline-flex items-center justify-center font-mono-score font-bold bg-[#18181b] text-zinc-200 w-10 py-1 rounded border border-border"
    >
      #{rank}
    </motion.div>
  )
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sortBy, setSortBy] = useState<keyof LeaderboardEntry>('meanScore')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [highlightedModelId, setHighlightedModelId] = useState<string | null>(null)
  const shouldReduceMotion = useReducedMotion()

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setIsLoading(true)
    setError(false)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/leaderboard')
      if (!res.ok) throw new Error('Failed to load leaderboard')
      const result = await res.json()
      setLeaderboardData(result)
    } catch (e) {
      console.error(e)
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  // Listen for hashtag highlight jumps
  useEffect(() => {
    if (leaderboardData.length === 0) return
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    if (hash) {
      const modelId = hash.replace('#', '')
      setHighlightedModelId(modelId)
      
      // Auto scroll to highlighted row
      setTimeout(() => {
        const el = document.getElementById(modelId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
    }
  }, [leaderboardData, typeof window !== 'undefined' ? window.location.hash : ''])

  // Handler for sorting column
  const handleSort = (field: keyof LeaderboardEntry) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDirection('desc') // default descending for metrics
    }
  }

  // Memoized sorted data
  const sortedData = useMemo(() => {
    const data = [...leaderboardData]
    data.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })
    return data
  }, [leaderboardData, sortBy, sortDirection])

  // Helper to render sorting direction indicator
  const SortIndicator = ({ field }: { field: keyof LeaderboardEntry }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-40 shrink-0" />
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4 text-accent shrink-0" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4 text-accent shrink-0" />
    )
  }

  const renderEmptyState = () => (
    <Card className="w-full max-w-xl mx-auto border-dashed border-zinc-800 bg-[#0d0d0e] py-12 px-6 text-center">
      <CardContent className="flex flex-col items-center justify-center space-y-5">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800">
          <AlertTriangle className="w-8 h-8 text-zinc-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-zinc-200">No Models Registered</h3>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto">
            The leaderboard is empty because no benchmark runs are available. Once you evaluate a model, its scores will display here.
          </p>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto space-y-8">
      {/* Navigation Header */}
      <header className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AlignBench</h1>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Overview
            </Link>
            <Link
              href="/leaderboard"
              className="text-foreground border-b-2 border-accent px-1 py-1"
            >
              Leaderboard
            </Link>
            <Link
              href="/runs/demo_heuristics_results"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Runs
            </Link>
            <Link
              href="/compare"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Compare
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-muted/40 border border-border px-2 py-0.5 rounded">
            <span>Ctrl K</span>
          </span>
          <ThemeToggle />
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-sm text-zinc-400">Loading Leaderboard rankings...</span>
        </div>
      ) : error ? (
        <Card className="w-full max-w-xl mx-auto border-border bg-[#0d0d0e] py-12 px-6 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-5">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-950/20 border border-red-900/30">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zinc-200">Connection Failed</h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                Could not establish a connection to the AlignBench FastAPI server. Make sure the backend server is running on port 8000.
              </p>
            </div>
            <button
              onClick={fetchLeaderboard}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          </CardContent>
        </Card>
      ) : leaderboardData.length === 0 ? (
        renderEmptyState()
      ) : (
        /* Leaderboard Card */
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Model Leaderboard</CardTitle>
            <CardDescription className="text-sm text-zinc-400">
              Click on column headers (Mean Score, Disagreement Rate, Run Count) to sort models.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto rounded-lg border border-border bg-[#0d0d0e]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px] text-zinc-300 font-semibold px-4 py-3">Rank</TableHead>
                    <TableHead className="text-zinc-300 font-semibold p-0">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center w-full h-full px-4 py-3 hover:text-foreground transition-colors focus:outline-none focus:text-accent text-left outline-none font-semibold"
                      >
                        Model Name
                        <SortIndicator field="name" />
                      </button>
                    </TableHead>
                    <TableHead className="text-zinc-300 font-semibold p-0">
                      <button
                        onClick={() => handleSort('meanScore')}
                        className="flex items-center w-full h-full px-4 py-3 hover:text-foreground transition-colors focus:outline-none focus:text-accent text-left outline-none font-semibold"
                      >
                        Mean Score
                        <SortIndicator field="meanScore" />
                      </button>
                    </TableHead>
                    <TableHead className="text-zinc-300 font-semibold p-0">
                      <button
                        onClick={() => handleSort('disagreementRate')}
                        className="flex items-center w-full h-full px-4 py-3 hover:text-foreground transition-colors focus:outline-none focus:text-accent text-left outline-none font-semibold"
                      >
                        Disagreement Rate
                        <SortIndicator field="disagreementRate" />
                      </button>
                    </TableHead>
                    <TableHead className="text-zinc-300 font-semibold p-0">
                      <button
                        onClick={() => handleSort('runCount')}
                        className="flex items-center w-full h-full px-4 py-3 hover:text-foreground transition-colors focus:outline-none focus:text-accent text-left outline-none font-semibold"
                      >
                        Run Count
                        <SortIndicator field="runCount" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                {/* Table body with framer-motion layout group for anim-reordering */}
                <TableBody>
                  <AnimatePresence initial={false}>
                    {sortedData.map((model, index) => {
                      const rank = index + 1
                      const isHighlighted = model.id === highlightedModelId

                      return (
                        <motion.tr
                          key={model.id}
                          id={model.id}
                          layout={shouldReduceMotion ? undefined : 'position'}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                            mass: 0.8,
                          }}
                          className={`border-b border-border hover:bg-muted/30 transition-all duration-300 ${
                            isHighlighted ? 'bg-indigo-500/10 border-indigo-500/30' : ''
                          }`}
                        >
                          <TableCell className="align-middle py-4">
                            <RankBadge rank={rank} shouldReduceMotion={!!shouldReduceMotion} />
                          </TableCell>
                          <TableCell className="font-semibold text-zinc-100 py-4">
                            {model.name}
                          </TableCell>
                          <TableCell className="font-mono-score text-zinc-300 py-4 font-medium">
                            {model.meanScore.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-mono-score text-zinc-300 py-4 font-medium">
                            {(model.disagreementRate * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell className="font-mono-score text-zinc-400 py-4 font-medium">
                            {model.runCount.toLocaleString()}
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
