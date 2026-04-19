import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from './api'
import { ApiError } from './types'

const ACTIVE_KEY = 'deployer:active'
const TOKEN_KEY = 'deployer:token'

beforeEach(() => {
  vi.restoreAllMocks()
  // Ensure storage shims exist in non-jsdom environments
  if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') {
    const make = () => {
      const store = new Map<string,string>()
      return {
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
        clear: () => store.clear(),
      }
    }
    ;(globalThis as any).localStorage = make()
    ;(globalThis as any).sessionStorage = make()
  } else {
    localStorage.clear()
    sessionStorage.clear()
  }
})

describe('api client', () => {
  it('sends requests to the active baseURL with Authorization header', async () => {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({ baseURL: 'https://api.example' }))
    sessionStorage.setItem(TOKEN_KEY, 'sekret')

    const apps = [{ id: '1', name: 'app', type: 'node', status: 'running' }]

    globalThis.fetch = vi.fn(async (url, init) => {
      expect(String(url)).toBe('https://api.example/apps')
      expect(init && (init as any).headers['Authorization']).toBe('Bearer sekret')
      return {
        ok: true,
        text: async () => JSON.stringify(apps),
      } as any
    })

    const res = await api.getApps()
    expect(res).toEqual(apps)
  })

  it('throws ApiError on non-2xx with parsed body', async () => {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({ baseURL: 'https://api.example' }))
    sessionStorage.setItem(TOKEN_KEY, 't')

    globalThis.fetch = vi.fn(async () => {
      return {
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: 'not found' }),
      } as any
    })

    await expect(api.getApps()).rejects.toBeInstanceOf(ApiError)
    try {
      await api.getApps()
    } catch (e: any) {
      expect(e.status).toBe(404)
      expect(e.body).toEqual({ error: 'not found' })
    }
  })

  it('passes AbortSignal to fetch', async () => {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({ baseURL: 'https://api.example' }))
    sessionStorage.setItem(TOKEN_KEY, 't')

    const controller = new AbortController()

    globalThis.fetch = vi.fn(async (url, init) => {
      expect((init as any).signal).toBe(controller.signal)
      return { ok: true, text: async () => 'null' } as any
    })

    await api.getApps(controller.signal)
  })
})
