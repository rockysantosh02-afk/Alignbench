import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ScatterPlot } from './ScatterPlot'
import { DisagreementCase } from '@/lib/mockData'

// Mock useReducedMotion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion')
  return {
    ...actual,
    useReducedMotion: () => false,
  }
})

describe('ScatterPlot Component', () => {
  const mockCases: DisagreementCase[] = [
    {
      id: 'case-agree',
      dimension: 'helpfulness',
      heuristicScore: 4.0,
      judgeScore: 4.0,
      prompt: 'Prompt A',
      response: 'Response A',
    },
    {
      id: 'case-disagree',
      dimension: 'honesty',
      heuristicScore: 4.5,
      judgeScore: 2.0, // Diff = 2.5 (>= 1.5)
      prompt: 'Prompt B',
      response: 'Response B',
    },
  ]

  it('renders all case points', () => {
    const { getByLabelText } = render(
      <ScatterPlot
        cases={mockCases}
        onSelectCase={() => {}}
      />
    )

    // Check if both interactive trigger buttons are rendered
    expect(getByLabelText(/case-agree/i)).toBeInTheDocument()
    expect(getByLabelText(/case-disagree/i)).toBeInTheDocument()
  })

  it('highlights high disagreement cases with breathing glow', () => {
    const { container } = render(
      <ScatterPlot
        cases={mockCases}
        onSelectCase={() => {}}
      />
    )

    const groups = container.querySelectorAll('g.group')
    expect(groups.length).toBe(2)

    // Group for case-agree (index 0) should not have the glow circle
    const groupAgreeCircles = groups[0].querySelectorAll('circle')
    expect(groupAgreeCircles.length).toBe(2) // main + invisible trigger

    // Group for case-disagree (index 1) should have the glow circle
    const groupDisagreeCircles = groups[1].querySelectorAll('circle')
    expect(groupDisagreeCircles.length).toBe(3) // glow + main + invisible trigger
  })
})
