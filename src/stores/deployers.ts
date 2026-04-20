import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DeployerMeta = {
  id: string
  label: string
  baseURL: string
  lastSeen: string
  isDefault?: boolean
}

type State = {
  deployers: DeployerMeta[]
  active?: string | null
  add: (meta: DeployerMeta) => void
  remove: (id: string) => void
  setActive: (id: string | null) => void
  rename: (id: string, label: string) => void
  setDefault: (id: string | null) => void
  getToken: (id: string) => string | null
  setToken: (id: string, token: string) => void
  clearToken: (id: string) => void
  switchActive: (id: string | null) => void
  onSwitch?: (id: string | null) => void
  setOnSwitch: (fn?: (id: string | null) => void) => void
}

const STORAGE_KEY = 'deployer:targets'

export const useDeployers = create<State>(
  persist(
    (set, get) => ({
      deployers: [],
      active: null,
      onSwitch: undefined,
      setOnSwitch: (fn) => set({ onSwitch: fn }),
      add: (meta) =>
        set((s) => ({ deployers: [...s.deployers.filter(d => d.id !== meta.id), meta] })),
      remove: (id) => {
        set((s) => ({ deployers: s.deployers.filter(d => d.id !== id), active: s.active === id ? null : s.active }))
        try { sessionStorage.removeItem(`deployer:token:${id}`) } catch {};
      },
      setActive: (id) => set({ active: id }),
      rename: (id, label) => set((s) => ({ deployers: s.deployers.map(d => d.id === id ? { ...d, label } : d) })),
      setDefault: (id) => set((s) => ({ deployers: s.deployers.map(d => ({ ...d, isDefault: d.id === id })) })),
      getToken: (id) => {
        try { return sessionStorage.getItem(`deployer:token:${id}`) } catch { return null }
      },
      setToken: (id, token) => { try { sessionStorage.setItem(`deployer:token:${id}`, token) } catch {} },
      clearToken: (id) => { try { sessionStorage.removeItem(`deployer:token:${id}`) } catch {} },
      switchActive: (id) => {
        set({ active: id })
        const fn = get().onSwitch
        if (fn) fn(id)
      }
    }),
    { name: STORAGE_KEY }
  )
)
