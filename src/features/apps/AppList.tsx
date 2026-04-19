import React, { useState } from 'react'
import useQuery from '../../lib/useQuery'
import { getApps } from '../../lib/api'
import AppRow from './AppRow'
import AddAppModal from './AddAppModal'
import Skeleton from '../../components/ui/Skeleton'

export default function AppList() {
  const q = useQuery(['apps'], () => getApps())
  const apps = q.data ?? []

  const [showAdd, setShowAdd] = useState(false)

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
            <div key={i} className={`flex items-center gap-4 px-4 py-3 border-b border-dashed ${i % 2 ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="w-56"><Skeleton className="h-4" /></div>
              <div className="w-28"><Skeleton className="h-4" /></div>
              <div className="flex gap-3">
                <Skeleton className="w-40 h-10" />
                <Skeleton className="w-40 h-10" />
                <Skeleton className="w-40 h-10" />
              </div>
              <div className="ml-auto w-8 h-8"><Skeleton className="h-8 w-8 rounded-full" /></div>
            </div>
          ))
        ) : apps.length === 0 ? (
          <div className="p-8 text-center text-sm text-[color:var(--muted)]">
            No apps registered.
            <button aria-label="Register new app" onClick={()=>setShowAdd(true)} className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded">+ register new app</button>
          </div>
        ) : (
          apps.map((a: any, idx: number) => (
            <div key={a.id} className={idx % 2 ? 'bg-gray-50' : 'bg-white'}>
              <AppRow app={a} />
            </div>
          ))
        )}
      </div>

      <AddAppModal open={showAdd} onClose={()=>setShowAdd(false)} />
    </div>
  )
}
