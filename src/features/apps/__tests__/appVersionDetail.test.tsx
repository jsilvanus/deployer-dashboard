import { vi, describe, it, expect } from 'vitest'

describe('AppVersionDetail', () => {
  it('calls getAppVersion and returns metadata (mocked)', async () => {
    const mockVersion = { id: 'v-1', appId: 'a-1', version: '1.2.3', createdAt: '2026-01-01T00:00:00Z', notes: 'Mock notes' }
    const api = await import('../../../lib/api')
    const spy = vi.spyOn(api, 'getAppVersion').mockResolvedValue(mockVersion)

    const res = await api.getAppVersion('a-1', 'v-1')
    expect(spy).toHaveBeenCalledWith('a-1', 'v-1')
    expect(res).toEqual(mockVersion)
    spy.mockRestore()
  })
})
