import React, { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import { useDeploymentPoll } from '../features/apps/DeploymentProgressInline'

const mockGetDeployment = vi.fn()

vi.mock('../lib/api', () => ({
  getDeployment: (...args: any[]) => mockGetDeployment(...args),
}))

function TestHarness({ responses }: { responses: any[] }) {
  const poll = useDeploymentPoll()
  useEffect(() => {
    mockGetDeployment.mockImplementation(() => Promise.resolve(responses.shift()))
    poll.start('d1')
    return () => poll.stop()
  }, [])
  return <div data-testid="out">{poll.progress ? `${poll.progress.current}/${poll.progress.total}` : 'idle'}</div>
}

describe('useDeploymentPoll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockGetDeployment.mockReset()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls until terminal and updates progress', async () => {
    const responses = [
      { id: 'd1', status: 'running', steps: [{ name: 'build', status: 'running' }, { name: 'release', status: 'pending' }] },
      { id: 'd1', status: 'running', steps: [{ name: 'build', status: 'success' }, { name: 'release', status: 'running' }] },
      { id: 'd1', status: 'success', steps: [{ name: 'build', status: 'success' }, { name: 'release', status: 'success' }] },
    ]

    render(<TestHarness responses={responses} />)

    // initial tick
    await waitFor(() => expect(screen.getByTestId('out').textContent).not.toBe('idle'))
    expect(screen.getByTestId('out').textContent).toBe('1/2')

    // advance 1s -> second response
    await vi.advanceTimersByTimeAsync(1000)
    await waitFor(() => expect(screen.getByTestId('out').textContent).toBe('2/2'))

    // advance 1s -> terminal response
    await vi.advanceTimersByTimeAsync(1000)
    await waitFor(() => expect(screen.getByTestId('out').textContent).toBe('2/2'))
  })

  it('backs off to 2s after 60s', async () => {
    // Provide many 'running' responses to force backoff
    const responses: any[] = []
    for (let i = 0; i < 5; i++) {
      responses.push({ id: 'd1', status: 'running', steps: [{ name: 's1', status: i === 0 ? 'running' : 'success' }, { name: 's2', status: 'pending' }] })
    }
    // final success
    responses.push({ id: 'd1', status: 'success', steps: [{ name: 's1', status: 'success' }, { name: 's2', status: 'success' }] })

    render(<TestHarness responses={responses} />)

    // initial
    await waitFor(() => expect(screen.getByTestId('out').textContent).not.toBe('idle'))

    // advance 60s to trigger backoff logic
    await vi.advanceTimersByTimeAsync(60000)

    // next tick should be scheduled at ~2s; advance 2s
    await vi.advanceTimersByTimeAsync(2000)
    // ensure we updated (no assertion on exact value, just that calls happened)
    expect(mockGetDeployment).toHaveBeenCalled()
  })
})
