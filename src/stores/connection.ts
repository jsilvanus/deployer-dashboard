type ConnectionState = {
  lastStatus: boolean | null
  lastSuccess: number | null
  lastChecked: number | null
}

let state: ConnectionState = { lastStatus: null, lastSuccess: null, lastChecked: null }
const subscribers = new Set<(s: ConnectionState) => void>()

export function subscribe(fn: (s: ConnectionState) => void) {
  subscribers.add(fn)
  try { fn(state) } catch (_) {}
  return () => { subscribers.delete(fn); }
}

export function setStatus(ok: boolean) {
  const now = Date.now()
  state = {
    lastStatus: ok,
    lastChecked: now,
    lastSuccess: ok ? now : state.lastSuccess
  }
  for (const s of Array.from(subscribers)) {
    try { s(state) } catch (_) {}
  }
}

export function getState() {
  return state
}

export default { subscribe, setStatus, getState }
