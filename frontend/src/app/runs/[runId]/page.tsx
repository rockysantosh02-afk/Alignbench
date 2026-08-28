'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion, useReducedMotion } from 'framer-motion'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Typewriter } from '@/components/Typewriter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { RefreshCw, AlertTriangle, Play, HelpCircle } from 'lucide-react'

export interface RunCase {
  id: string
  dimension: string
  heuristicScore: number
  judgeScore: number
  prompt: string
  response: string
  adversarial: boolean
  heuristicFlags: string[]
  judgeRationale: string
}

export interface RunMetadata {
  id: string
  modelName: string
  modelId: string
  runDate: string
  meanScore: number
  disagreementRate: number
  casesCount: number
  isJudgeEnabled: boolean
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 5 },
  show: { opacity: 1, scale: 1, y: 0 },
}

export default function RunDetailPage() {
  const { runId } = useParams() as { runId: string }
  const router = useRouter()
  
  const [runInfo, setRunInfo] = useState<RunMetadata | null>(null)
  const [allCases, setAllCases] = useState<RunCase[]>([])
  const [allRuns, setAllRuns] = useState<RunMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const [selectedCase, setSelectedCase] = useState<RunCase | null>(null)

  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDimension, setSelectedDimension] = useState('all')
  const [adversarialOnly, setAdversarialOnly] = useState(false)
  const [disagreementOnly, setDisagreementOnly] = useState(false)

  // Fetch Run cases and metadata
  const fetchRunDetails = async () => {
    setIsLoading(true)
    setError(false)
    try {
      // 1. Fetch current run details
      const metaRes = await fetch(`http://127.0.0.1:8000/api/runs/${runId}`)
      if (!metaRes.ok) throw new Error('Run metadata not found')
      const metaResult = await metaRes.json()
      setRunInfo(metaResult)

      // 2. Fetch cases for current run
      const casesRes = await fetch(`http://127.0.0.1:8000/api/runs/${runId}/cases`)
      if (!casesRes.ok) throw new Error('Run cases not found')
      const casesResult = await casesRes.json()
      setAllCases(casesResult)
    } catch (e) {
      console.error(e)
      setError(true)
      // Load all runs to help user pick a valid one
      try {
        const listRes = await fetch('http://127.0.0.1:8000/api/runs')
        if (listRes.ok) {
          const listResult = await listRes.json()
          setAllRuns(listResult)
        }
      } catch (err) {
        console.error(err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRunDetails()
  }, [runId])

  // Get unique dimensions for dropdown filter
  const dimensionsList = useMemo(() => {
    const dims = new Set<string>()
    allCases.forEach((c) => dims.add(c.dimension))
    return Array.from(dims)
  }, [allCases])

  // Memoized Filtered Cases
  const filteredCases = useMemo(() => {
    return allCases.filter((c) => {
      // Search term filter
      if (searchTerm && !c.prompt.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Dimension filter
      if (selectedDimension !== 'all' && c.dimension !== selectedDimension) {
        return false
      }

      // Adversarial toggle
      if (adversarialOnly && !c.adversarial) {
        return false
      }

      // Disagreement toggle (diff >= 1.5)
      if (
        disagreementOnly &&
        Math.abs(c.heuristicScore - c.judgeScore) < 1.5
      ) {
        return false
      }

      return true
    })
  }, [allCases, searchTerm, selectedDimension, adversarialOnly, disagreementOnly])

  // Virtualization Scroll Container Ref
  const parentRef = useRef<HTMLDivElement>(null)

  // Virtualizer config
  const rowVirtualizer = useVirtualizer({
    count: filteredCases.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isMobile ? 86 : 52),
    overscan: 5,
  })

  const renderNotFoundState = () => (
    <div className="space-y-6 py-6 max-w-xl mx-auto text-center">
      <Card className="border-border bg-[#0d0d0e] py-12 px-6">
        <CardContent className="flex flex-col items-center justify-center space-y-5">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800">
            <AlertTriangle className="w-8 h-8 text-zinc-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-zinc-200">Evaluation Run Not Found</h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              The run ID <span className="font-mono text-zinc-300">"{runId}"</span> does not exist or has been deleted. Select another run below:
            </p>
          </div>

          {allRuns.length > 0 ? (
            <div className="w-full max-w-md space-y-2 text-left mt-4 border-t border-border pt-4">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Available Runs:</span>
              <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                {allRuns.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => router.push(`/runs/${run.id}`)}
                    className="flex justify-between items-center w-full px-3 py-2 rounded bg-zinc-900/60 hover:bg-zinc-800 text-xs border border-zinc-800 transition-colors"
                  >
                    <span className="font-mono text-zinc-300 font-semibold">{run.id}</span>
                    <span className="text-zinc-500">{run.modelName}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic">No alternative runs found. Run python -m alignbench.evaluation.runner first.</div>
          )}
        </CardContent>
      </Card>
    </div>
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
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href={`/runs/${runId}`}
              className="text-foreground border-b-2 border-accent px-1 py-1"
            >
              Run Details
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
          <span className="text-sm text-zinc-400">Loading evaluation cases...</span>
        </div>
      ) : error ? (
        renderNotFoundState()
      ) : (
        <>
          {/* Run Info Card */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-100 uppercase">
                  Run: {runId}
                </h2>
                {runInfo && !runInfo.isJudgeEnabled && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    Judge scoring not yet enabled for this run
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                Model: <span className="font-semibold text-zinc-300">{runInfo?.modelName}</span>  •  Evaluated on: <span className="font-mono text-zinc-300">{runInfo?.runDate}</span>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 bg-muted/40 border border-border px-4 py-2 rounded-lg">
              <div>
                Total: <span className="font-bold text-zinc-200">{allCases.length}</span>
              </div>
              <div className="w-px h-3 bg-zinc-700" />
              <div>
                Filtered: <span className="font-bold text-accent">{filteredCases.length}</span>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar Card */}
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* Search Input */}
                <div className="col-span-1 md:col-span-2 relative">
                  <input
                    type="text"
                    placeholder="Search prompt text..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0d0d0e] border border-border rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* Dimension Dropdown */}
                <div>
                  <select
                    value={selectedDimension}
                    onChange={(e) => setSelectedDimension(e.target.value)}
                    className="w-full bg-[#0d0d0e] border border-border rounded-lg px-3 py-2 text-sm text-zinc-200 capitalize focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="all">All Dimensions</option>
                    {dimensionsList.map((dim) => (
                      <option key={dim} value={dim}>
                        {dim.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toggles */}
                <div className="flex gap-4 items-center justify-around md:justify-end">
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={adversarialOnly}
                      onChange={(e) => setAdversarialOnly(e.target.checked)}
                      className="rounded bg-[#0d0d0e] border-border text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    Adversarial
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={disagreementOnly}
                      onChange={(e) => setDisagreementOnly(e.target.checked)}
                      className="rounded bg-[#0d0d0e] border-border text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    Disagreement
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Virtualized Cases Table */}
          {filteredCases.length === 0 ? (
            <div className="text-center py-12 text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-[#0d0d0e]/20">
              No matching test cases found. Adjust your filters or query.
            </div>
          ) : (
            <div className="w-full border border-border bg-[#0d0d0e] rounded-xl overflow-hidden shadow-lg">
              {/* Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-border/80 bg-muted/30 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <div className="col-span-2">ID</div>
                <div className="col-span-2">Dimension</div>
                <div className="col-span-5">Prompt Preview</div>
                <div className="col-span-1 text-center">Heuristic</div>
                <div className="col-span-1 text-center">Judge</div>
                <div className="col-span-1 text-center">Diff</div>
              </div>

              {/* Scroll Container (Target of react-virtualizer) */}
              <div
                ref={parentRef}
                className="overflow-y-auto max-h-[520px] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const caseItem = filteredCases[virtualRow.index]
                    const scoreDiff = Math.abs(caseItem.heuristicScore - caseItem.judgeScore)
                    const isStrongDisagreement = scoreDiff >= 1.5

                    return (
                      <div
                        key={virtualRow.key}
                        onClick={() => setSelectedCase(caseItem)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedCase(caseItem)
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Inspect test case ${caseItem.id}. Dimension: ${caseItem.dimension}. Heuristic score ${caseItem.heuristicScore}, Judge score ${caseItem.judgeScore}`}
                        className={`flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 md:items-center px-4 py-3 border-b border-border/40 hover:bg-muted/30 focus:outline-none focus:bg-muted/40 transition-colors duration-150 cursor-pointer absolute top-0 left-0 w-full text-xs text-zinc-300`}
                        style={{
                          height: isMobile ? '86px' : '52px',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {/* Mobile Card Content (only visible on screen < md) */}
                        <div className="flex md:hidden flex-col gap-1.5 w-full">
                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-zinc-400">
                              {isStrongDisagreement && (
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                              )}
                              {caseItem.id}
                            </div>
                            <span className="capitalize text-[9px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border/50">
                              {caseItem.dimension.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="truncate text-zinc-300 font-mono text-[11px] leading-relaxed">
                            {caseItem.prompt}
                          </div>
                          <div className="flex justify-between items-center mt-0.5 border-t border-zinc-800/40 pt-1">
                            <div className="flex gap-3 text-[11px]">
                              <span className="text-zinc-500 font-semibold">Heuristic: <span className="text-indigo-400 font-mono font-bold">{caseItem.heuristicScore.toFixed(1)}</span></span>
                              <span className="text-zinc-500 font-semibold">Judge: <span className="text-emerald-400 font-mono font-bold">{caseItem.judgeScore.toFixed(1)}</span></span>
                            </div>
                            <span className={`font-mono text-[11px] font-bold ${isStrongDisagreement ? 'text-amber-500' : 'text-zinc-500'}`}>
                              Diff: {scoreDiff.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Desktop cells (hidden on screen < md) */}
                        <div className="hidden md:contents">
                          {/* ID */}
                          <div className="col-span-2 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-zinc-400">
                            {isStrongDisagreement && (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            )}
                            {caseItem.id}
                          </div>

                          {/* Dimension */}
                          <div className="col-span-2 capitalize text-zinc-400 truncate">
                            {caseItem.dimension.replace('_', ' ')}
                          </div>

                          {/* Prompt Preview */}
                          <div className="col-span-5 truncate text-zinc-300 font-mono text-[11px]">
                            {caseItem.prompt}
                          </div>

                          {/* Heuristic score */}
                          <div className="col-span-1 text-center font-mono-score font-bold text-indigo-400 text-[13px]">
                            {caseItem.heuristicScore.toFixed(1)}
                          </div>

                          {/* Judge score */}
                          <div className="col-span-1 text-center font-mono-score font-bold text-emerald-400 text-[13px]">
                            {caseItem.judgeScore.toFixed(1)}
                          </div>

                          {/* Diff */}
                          <div className={`col-span-1 text-center font-mono-score font-bold text-[13px] ${
                            isStrongDisagreement ? 'text-amber-500' : 'text-zinc-500'
                          }`}>
                            {scoreDiff.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Details Inspector Side Drawer */}
          <Drawer
            open={!!selectedCase}
            onOpenChange={(open) => !open && setSelectedCase(null)}
            direction="right"
          >
            <DrawerContent className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border bg-[#0a0a0b] p-6 shadow-xl sm:max-w-lg outline-none text-zinc-200">
              {selectedCase && (
                <>
                  {/* Drawer Header */}
                  <DrawerHeader className="border-b border-border pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded border border-border">
                        {selectedCase.id}
                      </span>
                      <div className="flex gap-2">
                        {selectedCase.adversarial && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 border border-red-500/20 bg-red-500/5 px-2 py-0.5 rounded">
                            Adversarial
                          </span>
                        )}
                        <span className="text-[9px] font-bold uppercase tracking-wider text-accent border border-accent/20 bg-accent/5 px-2 py-0.5 rounded capitalize">
                          {selectedCase.dimension.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <DrawerTitle className="text-xl font-bold mt-4">Inspector</DrawerTitle>
                    <DrawerDescription className="text-xs text-zinc-400">
                      Full evaluation breakdown, flags, and LLM-as-judge rationale.
                    </DrawerDescription>
                  </DrawerHeader>

                  {/* Scrollable details body */}
                  <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
                    {/* Visual Gauges */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Scores</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0d0d0e] border border-border p-4 rounded-xl space-y-2">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Heuristic</span>
                          <span className="text-2xl font-mono-score font-bold text-indigo-400 block">
                            {selectedCase.heuristicScore.toFixed(1)} / 5.0
                          </span>
                          <div className="w-full bg-zinc-800 h-1.5 rounded overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded"
                              style={{ width: `${(selectedCase.heuristicScore / 5.0) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-[#0d0d0e] border border-border p-4 rounded-xl space-y-2">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Judge</span>
                          <span className="text-2xl font-mono-score font-bold text-emerald-400 block">
                            {selectedCase.judgeScore.toFixed(1)} / 5.0
                          </span>
                          <div className="w-full bg-zinc-800 h-1.5 rounded overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded"
                              style={{ width: `${(selectedCase.judgeScore / 5.0) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Staggered Heuristic Flags */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Heuristic Flags</h5>
                      {selectedCase.heuristicFlags.length === 0 ? (
                        <div className="text-xs text-zinc-500 italic">No flags triggered.</div>
                      ) : (
                        <motion.div
                          variants={containerVariants}
                          initial="hidden"
                          animate="show"
                          className="flex flex-wrap gap-1.5"
                        >
                          {selectedCase.heuristicFlags.map((flag) => (
                            <motion.span
                              key={flag}
                              variants={badgeVariants}
                              className="text-[10px] font-mono font-medium text-amber-400 bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 rounded"
                            >
                              {flag}
                            </motion.span>
                          ))}
                        </motion.div>
                      )}
                    </div>

                    {/* Streamed Judge Rationale */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Judge Rationale</h5>
                      <Card className="border-border bg-[#0d0d0e]/60">
                        <CardContent className="p-4 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          <Typewriter text={selectedCase.judgeRationale} />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Prompt */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Prompt</h5>
                      <div className="bg-muted p-4 rounded-xl border border-border overflow-y-auto max-h-[160px] text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {selectedCase.prompt}
                      </div>
                    </div>

                    {/* Response */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Model Response</h5>
                      <div className="bg-muted p-4 rounded-xl border border-border overflow-y-auto max-h-[240px] text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {selectedCase.response}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </DrawerContent>
          </Drawer>
        </>
      )}
    </main>
  )
}
