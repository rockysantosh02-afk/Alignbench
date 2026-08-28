import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'AlignBench Evaluation Report'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

interface ImageProps {
  params: { runId: string }
}

async function fetchRunInfo(runId: string) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/runs/${runId}`)
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error("Fetch failed in OG image:", e)
    return null
  }
}

export default async function Image({ params }: ImageProps) {
  // Await params as required by Next.js 15
  const resolvedParams = await params
  const runId = resolvedParams?.runId
  const runInfo = runId ? await fetchRunInfo(runId) : null

  if (!runInfo) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0b',
            color: '#fafafa',
            fontFamily: 'sans-serif',
          }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 'bold' }}>Report Not Found</h1>
        </div>
      ),
      { ...size }
    )
  }

  // Simplified Radar Chart calculations for OG Image (Satori-compatible SVGs)
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

  const center = 150
  const radius = 100

  // Calculate polygon points
  const pointsString = dimensions
    .map((dim, i) => {
      const angle = (360 / 10) * i * (Math.PI / 180)
      const val = runInfo.dimensionScores?.[dim] || 0
      const r = (val / 5) * radius
      const x = center + r * Math.sin(angle)
      const y = center - r * Math.cos(angle)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  // Calculate grid lines
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0a0a0b',
          color: '#fafafa',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left Column - Metadata */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#6366f1',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            AlignBench Evaluation Report
          </span>
          
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: '0 0 10px 0',
              lineHeight: '1.1',
            }}
          >
            {runInfo.modelName}
          </h1>

          <span
            style={{
              fontSize: '18px',
              color: '#a1a1aa',
              marginBottom: '40px',
            }}
          >
            Run ID: {runInfo.id}  •  Date: {runInfo.runDate}
          </span>

          {/* Stats Boxes */}
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Mean Score */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '20px 30px',
                width: '180px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#a1a1aa',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Mean Score
              </span>
              <span
                style={{
                  fontSize: '44px',
                  fontWeight: 'bold',
                  color: '#6366f1',
                  marginTop: '8px',
                }}
              >
                {runInfo.meanScore?.toFixed(2) || '0.00'}
              </span>
            </div>

            {/* Disagreement Rate */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '20px 30px',
                width: '200px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#a1a1aa',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Disagreement
              </span>
              <span
                style={{
                  fontSize: '44px',
                  fontWeight: 'bold',
                  color: '#f59e0b',
                  marginTop: '8px',
                }}
              >
                {runInfo.disagreementRate ? (runInfo.disagreementRate * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Simplified Radar Chart SVG */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '24px',
            padding: '30px',
            width: '400px',
            height: '400px',
          }}
        >
          <svg
            width="300"
            height="300"
            viewBox="0 0 300 300"
            style={{ overflow: 'visible' }}
          >
            {/* Grid levels */}
            {gridLevels.map((level) => {
              const r = radius * level
              const gridPoints = dimensions
                .map((_, i) => {
                  const angle = (360 / 10) * i * (Math.PI / 180)
                  const x = center + r * Math.sin(angle)
                  const y = center - r * Math.cos(angle)
                  return `${x.toFixed(1)},${y.toFixed(1)}`
                })
                .join(' ')
              return (
                <polygon
                  key={level}
                  points={gridPoints}
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="1.5"
                />
              )
            })}

            {/* Axes lines */}
            {dimensions.map((_, i) => {
              const angle = (360 / 10) * i * (Math.PI / 180)
              const x = center + radius * Math.sin(angle)
              const y = center - radius * Math.cos(angle)
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1.5"
                />
              )
            })}

            {/* Plotted model polygon */}
            <polygon
              points={pointsString}
              fill="#6366f1"
              fillOpacity="0.25"
              stroke="#6366f1"
              strokeWidth="3"
            />

            {/* Plotted points */}
            {dimensions.map((dim, i) => {
              const angle = (360 / 10) * i * (Math.PI / 180)
              const val = runInfo.dimensionScores?.[dim] || 0
              const r = (val / 5) * radius
              const x = center + r * Math.sin(angle)
              const y = center - r * Math.cos(angle)
              return (
                <circle
                  key={dim}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#6366f1"
                  stroke="#18181b"
                  strokeWidth="1.5"
                />
              )
            })}
          </svg>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#a1a1aa',
              marginTop: '16px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Performance Footprint
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
