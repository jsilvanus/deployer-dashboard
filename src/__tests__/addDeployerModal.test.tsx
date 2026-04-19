import React from 'react'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'

beforeEach(() => { if (typeof localStorage !== 'undefined') { localStorage.clear(); sessionStorage.clear(); } vi.restoreAllMocks() })

import Add from '../features/header/AddDeployerModal'

describe('AddDeployerModal', () => {
  it('validates and saves on healthy response', async () => {
    const fetchMock = vi.fn(async (url:string)=>({ ok: true, json: async ()=>({status:'ok'}) }))
    // @ts-ignore
    global.fetch = fetchMock

    const addMock = vi.fn()
    const setTokenMock = vi.fn()
    const id = await AdddeployerTestHelper('https://api.test','secrett', addMock, setTokenMock)
    expect(addMock).toHaveBeenCalled()
    expect(setTokenMock).toHaveBeenCalled()
  })

  it('shows URL validation error', async ()=>{
    await expect(() => AdddeployerTestHelper('not-a-url','', ()=>{}, ()=>{})).rejects.toThrow('Invalid URL')
  })
})

async function AdddeployerTestHelper(base:string, token:string, add: any, setToken: any) {
  const mod = await import('../features/header/AddDeployerModal')
  const helper = mod.addDeployer
  return helper({ baseURL: base, token, label: 'L', add, setToken })
}
