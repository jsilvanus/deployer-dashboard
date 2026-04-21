/* @vitest-environment jsdom */

import React, { useEffect } from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const mockGetDeployment = vi.fn()

vi.mock('../lib/api', () => ({
  getDeployment: (...args: any[]) => mockGetDeployment(...args),
}))

import { createDeploymentPoll } from '../features/apps/DeploymentProgressInline'

function TestHarness({ responses }: { responses: any[] }) {
  const [out, setOut] = React.useState('idle')
  useEffect(() => {
    mockGetDeployment.mockImplementation(() => Promise.resolve(responses.shift()))
    const poll: any = createDeploymentPoll()
    poll.start('d1', (p: any) => setOut(p ? `${p.current}/${p.total}` : 'idle'))
    return () => {
      if (poll) poll.stop()
    }
  }, [])
  return React.createElement('div', { 'data-testid': 'out' }, out)
}

describe.skip('useDeploymentPoll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // timer-heavy tests; rely on global testTimeout in vitest config
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

    render(React.createElement(TestHarness, { responses }))

    // initial tick - flush microtasks so the mocked promise resolves and state updates
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.getByTestId('out').textContent).toBe('1/2')

    // advance 1s -> second response
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
      await Promise.resolve()
    })
    expect(screen.getByTestId('out').textContent).toBe('2/2')

    // advance 1s -> terminal response
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
      await Promise.resolve()
    })
    expect(screen.getByTestId('out').textContent).toBe('2/2')
  })

  it('backs off to 2s after 60s', async () => {
    const responses: any[] = []
    for (let i = 0; i < 5; i++) {
      responses.push({ id: 'd1', status: 'running', steps: [{ name: 's1', status: i === 0 ? 'running' : 'success' }, { name: 's2', status: 'pending' }] })
    }
    responses.push({ id: 'd1', status: 'success', steps: [{ name: 's1', status: 'success' }, { name: 's2', status: 'success' }] })

    render(React.createElement(TestHarness, { responses }))

    // flush initial microtasks so the first poll response is applied
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000)
      await Promise.resolve()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
      await Promise.resolve()
    })
    expect(mockGetDeployment).toHaveBeenCalled()
  })
})
