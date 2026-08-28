import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadarChart } from '@/components/RadarChart'

interface PageProps {
  params: Promise<{ runId: string }>
}

function getLocalRunInfo(runId: string) {
  try {
    const filePath = path.join(process.cwd(), '..', 'results', 'runs', `${runId}.json`)
    if (!fs.existsSync(filePath)) return null
    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)
    if (!Array.isArray(data) || data.length === 0) return null

    const firstItem = data[0]
    const modelName = firstItem.model_name || "Unknown Model"
    const modelSlug = "model-" + modelName.replace(":", "-").replace(".", "-").toLowerCase()

    const scores = data.map((r: any) => r.judge_score || 0.0)
    const meanScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length

    const disagreementCount = data.filter(
      (r: any) => Math.abs((r.heuristic_score || 0) - (r.judge_score || 0)) >= 1.5
    ).length
    const disagreementRate = disagreementCount / data.length

    // Parse date
    let runDate = "2026-08-27"
    if (runId.startsWith("run_") && runId.length >= 19) {
      try {
        runDate = `${runId.substring(4, 8)}-${runId.substring(8, 10)}-${runId.substring(10, 12)}`
      } catch (err) {}
    } else {
      const stats = fs.statSync(filePath)
      runDate = stats.mtime.toISOString().split('T')[0]
    }

    const dims: Record<string, number[]> = {}
    for (const r of data) {
      const dim = r.dimension || "unknown"
      if (!dims[dim]) dims[dim] = []
      dims[dim].push(r.judge_score || 0.0)
    }

    const dimensionScores: Record<string, number> = {}
    for (const [dim, valList] of Object.entries(dims)) {
      dimensionScores[dim] = valList.reduce((a, b) => a + b, 0) / valList.length
    }

    let isJudgeEnabled = false
    for (const r of data) {
      if (r.judge_score !== r.heuristic_score) {
        isJudgeEnabled = true
        break
      }
      if (!String(r.judge_rationale || "").toLowerCase().includes("heuristic-only")) {
        isJudgeEnabled = true
        break
      }
    }

    return {
      id: runId,
      modelName,
      modelId: modelSlug,
      runDate,
      meanScore,
      disagreementRate,
      dimensionScores,
      isJudgeEnabled,
    }
  } catch (e) {
    console.error("Local load failed:", e)
    return null
  }
}

export default async function ReportPage({ params }: PageProps) {
  const resolvedParams = await params
  const runId = resolvedParams?.runId
  const runInfo = runId ? getLocalRunInfo(runId) : null

  if (!runInfo) {
    notFound()
  }

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

  const series = [
    {
      name: runInfo.modelName,
      color: '#6366f1',
      values: dimensions.map((dim) => runInfo.dimensionScores[dim] ?? 0),
    },
  ]

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto space-y-8 bg-[#0a0a0b] text-[#fafafa]">
      {/* Standalone Minimal Header */}
      <header className="border-b border-border pb-4 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            AlignBench Evaluation Report
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1 text-zinc-100">
            {runInfo.modelName} Overview
          </h1>
        </div>
        <div className="text-xs text-zinc-500 font-mono">
          Public Read-Only
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Run Details Panel */}
        <div className="space-y-6">
          <Card className="border-border bg-[#0d0d0e]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                Run Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-zinc-400">Model Name</span>
                <span className="text-sm font-semibold text-zinc-200">{runInfo.modelName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-zinc-400">Run ID</span>
                <span className="text-sm font-mono text-zinc-300">{runInfo.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-zinc-400">Evaluation Date</span>
                <span className="text-sm font-mono text-zinc-300">{runInfo.runDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Stat summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0d0d0e] border border-border p-4 rounded-xl flex flex-col justify-center">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Mean Score
              </span>
              <span className="text-3xl font-mono-score font-bold text-indigo-400 mt-1">
                {runInfo.meanScore.toFixed(2)}
              </span>
            </div>

            <div className="bg-[#0d0d0e] border border-border p-4 rounded-xl flex flex-col justify-center">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Disagreement Rate
              </span>
              <span className="text-3xl font-mono-score font-bold text-amber-500 mt-1">
                {(runInfo.disagreementRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Judge warning badge inside report */}
          {!runInfo.isJudgeEnabled && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-xs text-amber-300 flex items-start gap-2">
              <span className="relative flex h-2 w-2 mt-1.5 shrink-0">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <div>
                <span className="font-semibold">Judge Scoring Disabled:</span> Judge scoring is not yet active for this run. Scores shown are fallback automated heuristic ratings.
              </div>
            </div>
          )}

          {/* Interactive CTA Link */}
          <Card className="border-indigo-500/20 bg-indigo-500/5">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-indigo-300">
                Need more deep-dive analytics?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Log in to the dashboard to filter individual test cases, read complete prompt/response pairings, explore adversarial examples, and inspect judge rationales.
              </p>
              <div className="pt-2">
                <Link
                  href={`/runs/${runInfo.id}`}
                  className="inline-flex justify-center items-center px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  View full interactive dashboard
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart Panel */}
        <Card className="border-border bg-[#0d0d0e] flex flex-col items-center">
          <CardHeader className="w-full text-center pb-2">
            <CardTitle className="text-base text-zinc-300">Performance Footprint</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Evaluated performance across 10 safety and capability dimensions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center w-full pt-2">
            <RadarChart
              dimensions={dimensions}
              series={series}
              maxValue={5}
              size={360}
              showLegend={false}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
