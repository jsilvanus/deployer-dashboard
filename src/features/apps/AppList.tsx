import React from 'react'
import useQuery from '../../lib/useQuery'
import { getApps } from '../../lib/api'
import AppRow from './AppRow'

export default function AppList() {
  const q = useQuery(['apps'], () => getApps())
  const apps = q.data ?? []

  return (
    <div className="rounded-md overflow-hidden border">
      <div className="flex items-center px-4 py-2 bg-gray-900 text-white font-semibold">
        <div className="w-56">App</div>
        <div className="w-28">Status</div>
        <div className="flex gap-3">Metrics</div>
        <div className="ml-auto" />
      </div>

      <div role="table" aria-label="apps table">
        {q.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex items-center gap-4 px-4 py-3 border-b border-dashed animate-pulse ${i % 2 ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="w-56 h-4 bg-gray-200 rounded" />
              <div className="w-28 h-4 bg-gray-200 rounded" />
              <div className="flex gap-3">
                <div className="w-40 h-10 bg-gray-200 rounded" />
                <div className="w-40 h-10 bg-gray-200 rounded" />
                <div className="w-40 h-10 bg-gray-200 rounded" />
              </div>
              <div className="ml-auto w-8 h-8 bg-gray-200 rounded" />
            </div>
          ))
        ) : apps.length === 0 ? (
          <div className="p-8 text-center text-sm text-[color:var(--muted)]">
            No apps registered. <button className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded">+ register new app</button>
          </div>
        ) : (
          apps.map((a: any, idx: number) => (
            <div key={a.id} className={idx % 2 ? 'bg-gray-50' : 'bg-white'}>
              <AppRow app={a} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
