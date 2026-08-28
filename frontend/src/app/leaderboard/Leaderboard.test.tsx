import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LeaderboardPage from './page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/leaderboard',
}))

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion')
  return {
    ...actual,
    useReducedMotion: () => false,
  }
})

describe('Leaderboard Page - Sorting Logic', () => {
  const mockModels = [
    {
      id: 'model-a',
      name: 'Model A',
      meanScore: 4.2,
      disagreementRate: 0.15,
      runCount: 5,
      dimensionScores: {},
    },
    {
      id: 'model-b',
      name: 'Model B',
      meanScore: 4.8,
      disagreementRate: 0.05,
      runCount: 10,
      dimensionScores: {},
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock fetch for Leaderboard page
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/leaderboard')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockModels),
        } as Response)
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  it('initially sorts models by Mean Score descending', async () => {
    const { getAllByRole } = render(<LeaderboardPage />)

    await waitFor(() => {
      const rows = getAllByRole('row')
      // Row 0 is header
      // Row 1 should be Model B (4.8)
      // Row 2 should be Model A (4.2)
      expect(rows[1]).toHaveTextContent('Model B')
      expect(rows[2]).toHaveTextContent('Model A')
    })
  })

  it('re-sorts models when clicking sort header', async () => {
    const { getByRole, getAllByRole } = render(<LeaderboardPage />)

    await waitFor(() => {
      expect(getAllByRole('row')[1]).toHaveTextContent('Model B')
    })

    // Click Mean Score sort button
    const meanScoreHeader = getByRole('button', { name: /mean score/i })
    fireEvent.click(meanScoreHeader)

    // Now it should sort descending/ascending. Since initial is desc, clicking once should flip it to asc.
    // So Row 1 should be Model A (4.2) and Row 2 should be Model B (4.8)
    const rows = getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Model A')
    expect(rows[2]).toHaveTextContent('Model B')
  })

  it('sorts by Disagreement Rate when header is clicked', async () => {
    const { getByRole, getAllByRole } = render(<LeaderboardPage />)

    await waitFor(() => {
      expect(getAllByRole('row')[1]).toHaveTextContent('Model B')
    })

    // Click Disagreement Rate sort button
    const disagreementHeader = getByRole('button', { name: /disagreement rate/i })
    
    // First click sorts desc: Model A (0.15) should be first, Model B (0.05) second
    fireEvent.click(disagreementHeader)
    let rows = getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Model A')
    expect(rows[2]).toHaveTextContent('Model B')

    // Second click sorts asc: Model B (0.05) should be first, Model A (0.15) second
    fireEvent.click(disagreementHeader)
    rows = getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Model B')
    expect(rows[2]).toHaveTextContent('Model A')
  })
})
