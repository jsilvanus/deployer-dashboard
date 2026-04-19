import { useEffect, useRef, useState } from 'react'

type QueryKey = any[]

type Options = {
  enabled?: boolean
  refetchInterval?: number | false | null
}

const cache = new Map<string, any>()

function keyToString(k: QueryKey) {
  try {
    return JSON.stringify(k)
  } catch (e) {
    return String(k)
  }
}

// expose a tiny client for other parts of the app to read cached data
;(globalThis as any).__REACT_QUERY_CLIENT__ = {
  getQueryData: (k: QueryKey) => cache.get(keyToString(k)),
}

export default function useQuery<T = any>(key: QueryKey, fn: () => Promise<T>, opts: Options = {}) {
  const ks = keyToString(key)
  const mounted = useRef(true)
  const [data, setData] = useState<T | undefined>(() => cache.get(ks))
  const [isLoading, setLoading] = useState(!cache.has(ks))
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    let controller = new AbortController()
    let intervalId: any = null

    async function load() {
      if (opts.enabled === false) return
      setLoading(true)
      setError(null)
      try {
        const res = await fn()
        if (!mounted.current) return
        cache.set(ks, res)
        setData(res)
      } catch (e) {
        if (!mounted.current) return
        setError(e)
      } finally {
        if (mounted.current) setLoading(false)
      }
    }

    load()
    if (opts.refetchInterval && opts.enabled !== false) {
      intervalId = setInterval(() => {
        // call but ignore returned value
        fn().then(res => { if (mounted.current) { cache.set(ks, res); setData(res) } }).catch(() => {})
      }, opts.refetchInterval)
    }

    return () => {
      controller.abort()
      if (intervalId) clearInterval(intervalId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ks, opts.enabled, String(opts.refetchInterval)])

  return { data, isLoading, error }
}
