'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { StatRow } from '@/components/StatRow'
import { RadarChart } from '@/components/RadarChart'
import { ScatterPlot } from '@/components/ScatterPlot'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Database, AlertTriangle, RefreshCw } from 'lucide-react'

export interface DisagreementCase {
  id: string
  dimension: string
  heuristicScore: number
  judgeScore: number
  prompt: string
  response: string
}

export interface OverviewData {
  totalCases: number
  modelsTestedCount: number
  disagreementRate: number
  meanHumanCorrelation: number
  dimensionScores: Array<{ dimension: string; model: string; score: number }>
}

export default function HomePage() {
  const [selectedCase, setSelectedCase] = useState<DisagreementCase | null>(null)
  const [data, setData] = useState<OverviewData | null>(null)
  const [cases, setCases] = useState<DisagreementCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const dimensions = [
    'helpfulness',
    'honesty',
    'instruction_following',
    'reasoning',
    'creativity',
    'safety',
    'coherence',
    'conciseness',
    'tone',
    'depth',
  ]

  // Retrieve data from FastAPI backend
  const fetchData = async () => {
    setIsLoading(true)
    setError(false)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/overview')
      if (!res.ok) throw new Error('API request failed')
      const result = await res.json()
      setData(result)
      setCases(result.disagreementCases || [])
    } catch (e) {
      console.error(e)
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Process models and colors from loaded data
  const models = data ? Array.from(new Set(data.dimensionScores.map((d) => d.model))) : []
  const modelColors: Record<string, string> = {
    'qwen3:latest': '#4f46e5', // indigo
    'llama3:latest': '#22c55e', // green
    'GPT-4o': '#4f46e5',
    'Claude 3.5 Sonnet': '#ec4899',
    'Llama 3 70B': '#22c55e',
    'Qwen 2.5 72B': '#f59e0b',
    'Mistral Large 2': '#ef4444',
  }
  const colorPalette = ['#4f46e5', '#ec4899', '#22c55e', '#f59e0b', '#ef4444', '#a1a1aa']

  const series = models.map((model, idx) => ({
    name: model,
    color: modelColors[model] || colorPalette[idx % colorPalette.length],
    values: dimensions.map((dim) => {
      const entry = data?.dimensionScores.find(
        (d) => d.dimension === dim && d.model === model
      )
      return entry?.score ?? 0
    }),
  }))

  const handleSelectCase = (c: DisagreementCase) => {
    setSelectedCase(c)
  }

  const renderEmptyState = () => (
    <Card className="w-full max-w-xl mx-auto border-dashed border-zinc-800 bg-[#0d0d0e] py-12 px-6 text-center">
      <CardContent className="flex flex-col items-center justify-center space-y-5">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800">
          <Database className="w-8 h-8 text-zinc-500" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600"></span>
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-zinc-200">No Evaluation Runs Found</h3>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto">
            The results directory results/runs/ is currently empty or has no valid JSON records. Please execute a benchmark run to see data.
          </p>
        </div>
        <div className="bg-black/50 border border-border rounded-lg p-4 font-mono text-left text-xs text-zinc-400 w-full max-w-md select-all">
          <span className="text-zinc-600"># Run benchmark pipeline</span>
          <br />
          python -m alignbench.evaluation.runner
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors border border-zinc-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      </CardContent>
    </Card>
  )

  const renderErrorState = () => (
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
        <div className="bg-black/50 border border-border rounded-lg p-4 font-mono text-left text-xs text-zinc-400 w-full max-w-md select-all">
          <span className="text-zinc-600"># Start backend API server</span>
          <br />
          python -m uvicorn backend.main:app --reload
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
          Retry Connection
        </button>
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
              className="text-foreground border-b-2 border-accent px-1 py-1"
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
          <span className="text-sm text-zinc-400">Loading AlignBench dashboard...</span>
        </div>
      ) : error ? (
        renderErrorState()
      ) : !data || data.totalCases === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Stat Row */}
          <StatRow
            stats={[
              {
                label: 'Total Cases Scored',
                value: data.totalCases,
              },
              {
                label: 'Models Tested',
                value: data.modelsTestedCount,
              },
              {
                label: 'Avg Disagreement Rate',
                value: data.disagreementRate,
                format: (val) => `${(val * 100).toFixed(1)}%`,
              },
              {
                label: 'Mean Human Correlation',
                value: data.meanHumanCorrelation,
                format: (val) => val.toFixed(2),
              },
            ]}
          />

          {/* Radar Chart Card */}
          {series.length > 0 && (
            <Card className="w-full max-w-2xl mx-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Model Dimension Scores</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex justify-center">
                <RadarChart
                  dimensions={dimensions}
                  series={series}
                  maxValue={5}
                  size={380}
                />
              </CardContent>
            </Card>
          )}

          {/* Disagreement Explorer Card */}
          {cases.length > 0 && (
            <Card className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Disagreement Explorer</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  A scatter plot displaying heuristic score vs. judge score to identify where automated evaluations diverge from humans.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ScatterPlot
                  cases={cases}
                  selectedCaseId={selectedCase?.id}
                  onSelectCase={handleSelectCase}
                />
              </CardContent>
            </Card>
          )}

          {/* Details Side Drawer */}
          <Drawer
            open={!!selectedCase}
            onOpenChange={(open) => !open && setSelectedCase(null)}
            direction="right"
          >
            <DrawerContent className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border bg-background p-6 shadow-xl sm:max-w-lg outline-none">
              {selectedCase && (
                <>
                  <DrawerHeader className="border-b border-border pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded border border-border">
                        {selectedCase.id}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent border border-accent/20 bg-accent/5 px-2 py-0.5 rounded-full">
                        {selectedCase.dimension}
                      </span>
                    </div>
                    <DrawerTitle className="text-xl font-bold mt-4">Case Details</DrawerTitle>
                    <DrawerDescription>
                      Reviewing disagreement between the auto heuristic and final judge scores.
                    </DrawerDescription>
                  </DrawerHeader>

                  <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
                    {/* Scores Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#18181b] border border-border p-4 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Heuristic Score</span>
                        <span className="text-3xl font-mono-score font-bold text-indigo-400 mt-1">
                          {selectedCase.heuristicScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="bg-[#18181b] border border-border p-4 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Judge Score</span>
                        <span className="text-3xl font-mono-score font-bold text-emerald-400 mt-1">
                          {selectedCase.judgeScore.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Significant Disagreement Highlight */}
                    {Math.abs(selectedCase.heuristicScore - selectedCase.judgeScore) >= 1.5 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-xs text-amber-300 flex items-start gap-2">
                        <span className="relative flex h-2 w-2 mt-1.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <div>
                          <span className="font-semibold">Significant Disagreement:</span> The automated heuristic score differed from the judge by <span className="font-mono font-semibold">{Math.abs(selectedCase.heuristicScore - selectedCase.judgeScore).toFixed(1)}</span> points.
                        </div>
                      </div>
                    )}

                    {/* Prompt */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prompt</h5>
                      <div className="bg-muted p-4 rounded-lg border border-border overflow-y-auto max-h-[160px] text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {selectedCase.prompt}
                      </div>
                    </div>

                    {/* Response */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Model Response</h5>
                      <div className="bg-muted p-4 rounded-lg border border-border overflow-y-auto max-h-[240px] text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
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