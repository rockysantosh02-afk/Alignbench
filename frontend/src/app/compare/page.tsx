'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RadarChart } from '@/components/RadarChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export interface LeaderboardEntry {
  id: string
  name: string
  meanScore: number
  disagreementRate: number
  runCount: number
  dimensionScores: Record<string, number>
}

export interface SharedCase {
  id: string
  prompt: string
  responses: Record<string, string>
  scores: Record<string, { heuristicScore: number; judgeScore: number }>
}

const colorPalette = ['#4f46e5', '#ec4899', '#22c55e', '#f59e0b', '#ef4444', '#a1a1aa']

export default function ComparePage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [sharedCases, setSharedCases] = useState<SharedCase[]>([])
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([])
  const [dimmedModelIds, setDimmedModelIds] = useState<string[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const getModelColor = (modelId: string) => {
    const idx = leaderboardData.findIndex((m) => m.id === modelId)
    const customColors: Record<string, string> = {
      'model-gpt4o': '#4f46e5',
      'model-claude35': '#ec4899',
      'model-llama3-70b': '#22c55e',
      'model-qwen25-72b': '#f59e0b',
      'model-mistral-large2': '#ef4444',
      'model-qwen3-latest': '#4f46e5',
      'model-llama3-latest': '#22c55e',
    }
    return customColors[modelId] || colorPalette[idx >= 0 ? idx % colorPalette.length : 0]
  }

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true)
    setError(false)
    try {
      // Fetch models
      const modelsRes = await fetch('http://127.0.0.1:8000/api/leaderboard')
      if (!modelsRes.ok) throw new Error('Failed to load models')
      const modelsResult = await modelsRes.json()
      setLeaderboardData(modelsResult)

      // Fetch shared cases
      const casesRes = await fetch('http://127.0.0.1:8000/api/compare/cases')
      if (!casesRes.ok) throw new Error('Failed to load shared cases')
      const casesResult = await casesRes.json()
      setSharedCases(casesResult)

      // Setup default selections
      if (modelsResult.length > 0) {
        setSelectedModelIds(modelsResult.slice(0, 2).map((m: any) => m.id))
      }
      if (casesResult.length > 0) {
        setSelectedCaseId(casesResult[0].id)
      }
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

  // Handle Model Selection change
  const handleModelToggle = (modelId: string) => {
    setSelectedModelIds((prev) => {
      if (prev.includes(modelId)) {
        const updated = prev.filter((id) => id !== modelId)
        setDimmedModelIds((d) => d.filter((id) => id !== modelId))
        return updated
      } else {
        if (prev.length >= 3) return prev
        return [...prev, modelId]
      }
    })
  }

  // Toggle dimming for a model
  const handleDimToggle = (modelId: string) => {
    setDimmedModelIds((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    )
  }

  // Get selected case detail
  const activeCase = useMemo(() => {
    return sharedCases.find((c) => c.id === selectedCaseId) || sharedCases[0]
  }, [sharedCases, selectedCaseId])

  // Map selected models to RadarChart series format
  const series = useMemo(() => {
    return selectedModelIds.map((modelId) => {
      const modelInfo = leaderboardData.find((m) => m.id === modelId)
      const baseColor = getModelColor(modelId)
      
      const isDimmed = dimmedModelIds.includes(modelId)
      const finalColor = isDimmed ? `${baseColor}22` : baseColor

      return {
        name: modelInfo?.name || modelId,
        color: finalColor,
        values: dimensions.map((dim) => {
          return modelInfo?.dimensionScores[dim] ?? 0
        }),
      }
    })
  }, [selectedModelIds, dimmedModelIds, leaderboardData])

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
              href="/runs/demo_heuristics_results"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Runs
            </Link>
            <Link
              href="/compare"
              className="text-foreground border-b-2 border-accent px-1 py-1"
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
          <span className="text-sm text-zinc-400">Loading comparison details...</span>
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
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          </CardContent>
        </Card>
      ) : leaderboardData.length === 0 ? (
        <div className="text-center py-12 text-sm text-zinc-500">
          No models found. Please run the benchmark to compare.
        </div>
      ) : (
        <>
          {/* Model Picker Card */}
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Select Models for Side-by-Side Comparison</CardTitle>
              <CardDescription className="text-sm text-zinc-400">
                Pick up to 3 models from the leaderboard list to compare their metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {leaderboardData.map((model) => {
                  const isSelected = selectedModelIds.includes(model.id)
                  const isDisabled = !isSelected && selectedModelIds.length >= 3
                  const color = getModelColor(model.id)

                  return (
                    <button
                      key={model.id}
                      disabled={isDisabled}
                      onClick={() => handleModelToggle(model.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                        isSelected
                          ? 'bg-muted border-zinc-600 text-zinc-100'
                          : isDisabled
                          ? 'opacity-40 border-border bg-transparent text-zinc-600 cursor-not-allowed'
                          : 'border-border bg-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: isSelected ? color : 'transparent',
                          border: isSelected ? 'none' : '1px solid #71717a',
                        }}
                      />
                      {model.name}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart Card with interactive legend */}
          {selectedModelIds.length > 0 && (
            <Card className="w-full max-w-3xl mx-auto">
              <CardHeader className="pb-2 text-center">
                <CardTitle className="text-xl">Radar Metric Breakdown</CardTitle>
                <CardDescription className="text-sm text-zinc-400">
                  Click model name in the legend to toggle shape visibility (dim/undim).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col items-center">
                <RadarChart
                  dimensions={dimensions}
                  series={series}
                  maxValue={5}
                  size={360}
                  showLegend={false}
                />

                {/* Custom Interactive Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  {selectedModelIds.map((modelId) => {
                    const modelInfo = leaderboardData.find((m) => m.id === modelId)
                    const color = getModelColor(modelId)
                    const isDimmed = dimmedModelIds.includes(modelId)

                    return (
                      <button
                        key={modelId}
                        onClick={() => handleDimToggle(modelId)}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md border transition-all duration-150 text-xs font-medium ${
                          isDimmed
                            ? 'border-border/30 bg-[#121214]/30 text-zinc-500 line-through decoration-zinc-600'
                            : 'border-border bg-[#18181b] text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded"
                          style={{
                            backgroundColor: color,
                            opacity: isDimmed ? 0.2 : 1,
                          }}
                        />
                        {modelInfo?.name}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prompt Comparison View */}
          {selectedModelIds.length > 0 && activeCase && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-zinc-200">Side-by-Side Prompt Explorer</h3>
                
                {/* Case selector dropdown */}
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="bg-[#0d0d0e] border border-border rounded-lg px-3 py-2 text-sm text-zinc-200 font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {sharedCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shared Prompt Block */}
              <Card className="w-full border-zinc-800 bg-[#0d0d0e]/60">
                <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Shared Prompt</span>
                </CardHeader>
                <CardContent className="py-3 px-4 text-sm font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {activeCase.prompt}
                </CardContent>
              </Card>

              {/* Model Response Columns */}
              <div
                className="grid gap-6 w-full"
                style={{
                  gridTemplateColumns: isMobile
                    ? 'repeat(1, minmax(0, 1fr))'
                    : `repeat(${selectedModelIds.length}, minmax(0, 1fr))`,
                }}
              >
                {selectedModelIds.map((modelId) => {
                  const modelInfo = leaderboardData.find((m) => m.id === modelId)
                  const color = getModelColor(modelId)
                  const response = activeCase.responses[modelId] || 'No response.'
                  const scoreInfo = activeCase.scores[modelId]

                  return (
                    <div
                      key={modelId}
                      className="flex flex-col border border-border bg-[#0d0d0e] rounded-xl overflow-hidden shadow-lg h-[400px]"
                    >
                      {/* Column Header */}
                      <div
                        className="p-4 border-b border-border text-center flex items-center justify-between gap-2"
                        style={{ borderTop: `3px solid ${color}` }}
                      >
                        <span className="font-bold text-zinc-100 text-sm">{modelInfo?.name}</span>
                        
                        {/* Score Badges */}
                        {scoreInfo && (
                          <div className="flex gap-1.5 font-mono-score text-[10px] font-bold">
                            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                              H: {scoreInfo.heuristicScore.toFixed(1)}
                            </span>
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                              J: {scoreInfo.judgeScore.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Scrollable Response Container */}
                      <div className="flex-1 overflow-y-auto p-4 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {response}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {selectedModelIds.length === 0 && (
            <div className="text-center py-12 text-sm text-zinc-500">
              Please select at least one model to begin comparison.
            </div>
          )}
        </>
      )}
    </main>
  )
}
