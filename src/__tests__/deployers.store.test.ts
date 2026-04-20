import { beforeEach, describe, expect, it, vi } from 'vitest'

if (typeof sessionStorage === 'undefined') {
  // minimal in-memory sessionStorage polyfill for tests
  ;(globalThis as any).sessionStorage = (() => {
    const store: Record<string,string> = {}
    return {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = String(v) },
      removeItem: (k: string) => { delete store[k] },
      clear: () => { for (const k in store) delete store[k] }
    }
  })()
}

beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
    sessionStorage.clear()
  }
})

describe('deployers store', () => {
  it('adds, renames, removes and token helpers', async () => {
    const mod = await import('../stores/deployers')
    const { useDeployers } = mod
    const store = useDeployers.getState()
    const meta = { id: 't1', label: 'One', baseURL: 'https://example.test', lastSeen: 'now' }
    store.add(meta)
    expect(useDeployers.getState().deployers.find(d=>d.id==='t1')).toBeTruthy()

    useDeployers.getState().rename('t1', 'Renamed')
    expect(useDeployers.getState().deployers.find(d=>d.id==='t1')!.label).toBe('Renamed')

    useDeployers.getState().setToken('t1', 'tok')
    expect(sessionStorage.getItem('deployer:token:t1')).toBe('tok')

    useDeployers.getState().clearToken('t1')
    expect(sessionStorage.getItem('deployer:token:t1')).toBeNull()

    useDeployers.getState().remove('t1')
    expect(useDeployers.getState().deployers.find(d=>d.id==='t1')).toBeUndefined()
  })

  it('switchActive triggers onSwitch callback', async () => {
    const mod = await import('../stores/deployers')
    const { useDeployers } = mod
    const calls: Array<string|null> = []
    useDeployers.getState().setOnSwitch(id => calls.push(id))
    useDeployers.getState().switchActive('a')
    expect(calls).toEqual(['a'])
  })
})
