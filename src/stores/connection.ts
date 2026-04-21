let connected: boolean | null = null
const subscribers = new Set<(v: boolean | null) => void>()

export function subscribe(fn: (v: boolean | null) => void) {
  subscribers.add(fn)
  try { fn(connected) } catch (_) {}
  return () => subscribers.delete(fn)
}

export function setConnected(v: boolean | null) {
  connected = v
  for (const s of Array.from(subscribers)) {
    try { s(connected) } catch (_) {}
  }
}

export function getConnected() {
  return connected
}

export default { subscribe, setConnected, getConnected }
