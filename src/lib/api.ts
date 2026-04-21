export async function apiGet(baseURL: string, path: string, token?: string) {
  const url = new URL(path, baseURL).toString()
  const headers: Record<string, string> = {}
  if (token) headers['authorization'] = `Bearer ${token}`

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err: any = new Error(`Request failed: ${res.status}`)
    err.status = res.status
    err.body = text
    throw err
  }
  return res.json().catch(() => null)
}

export async function checkHealth(baseURL: string, token?: string) {
  return apiGet(baseURL, '/health', token)
}
import { ApiError, App, Deployment, LogParams, Metrics, AppVersion, RegistryAuth, ScheduleConfig, ServerResponse } from './types'

const ACTIVE_KEY = 'deployer:active'
const TOKEN_KEY = 'deployer:token'

function getActiveBaseURL(): string | null {
  try {
    const v = localStorage.getItem(ACTIVE_KEY)
    if (!v) return null
    const parsed = JSON.parse(v)
    return parsed?.baseURL ?? null
  } catch (e) {
    return null
  }
}

function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

function joinURL(base: string, path: string) {
  if (!base) return path
  return `${base.replace(/\/+$/,'')}/${path.replace(/^\/+/, '')}`
}

async function parseBody(resp: Response) {
  const text = await resp.text()
  try {
    return text ? JSON.parse(text) : null
  } catch (e) {
    return text
  }
}

async function request<T = any>(path: string, opts: Omit<RequestInit, 'body'> & { body?: any } = {}, signal?: AbortSignal): Promise<T> {
  const base = getActiveBaseURL()
  if (!base) throw new Error('No active deployer configured')

  const url = joinURL(base, path)
  const headers: Record<string,string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    opts.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)
  }

  const res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers as any) }, signal })
  if (res.ok) {
    // allow empty responses
    const txt = await res.text()
    try {
      return (txt ? JSON.parse(txt) : null) as T
    } catch (e) {
      // non-json body
      return (txt as unknown) as T
    }
  }

  const body = await parseBody(res)
  throw new ApiError(res.status, body)
}

export async function getHealth(signal?: AbortSignal) {
  return request('/health', { method: 'GET' }, signal)
}

export async function getApps(signal?: AbortSignal): Promise<App[]> {
  return request<App[]>('/apps', { method: 'GET' }, signal)
}

export async function getApp(id: string, signal?: AbortSignal): Promise<App> {
  return request<App>(`/apps/${encodeURIComponent(id)}`, { method: 'GET' }, signal)
}

export async function patchApp(id: string, body: Partial<App>, signal?: AbortSignal): Promise<App> {
  return request<App>(`/apps/${encodeURIComponent(id)}`, { method: 'PATCH', body }, signal)
}

export async function postApp(body: Partial<App>, signal?: AbortSignal): Promise<App> {
  return request<App>('/apps', { method: 'POST', body }, signal)
}

export async function postAppDeploy(id: string, action: string, signal?: AbortSignal): Promise<{ deploymentId: string }>
{
  return request<{ deploymentId: string }>(`/apps/${encodeURIComponent(id)}/deploy`, { method: 'POST', body: { action } }, signal)
}

// compatibility wrappers for older code that used postDeploy/postUpdate/postRollback
export async function postDeploy(id: string, signal?: AbortSignal) {
  return request(`/apps/${encodeURIComponent(id)}/deploy`, { method: 'POST' }, signal)
}

export async function postUpdate(id: string, signal?: AbortSignal) {
  return request(`/apps/${encodeURIComponent(id)}/update`, { method: 'POST' }, signal)
}

export async function postRollback(id: string, signal?: AbortSignal) {
  return request(`/apps/${encodeURIComponent(id)}/rollback`, { method: 'POST' }, signal)
}

export async function getAppStatus(id: string, signal?: AbortSignal) {
  return request(`/apps/${encodeURIComponent(id)}/status`, { method: 'GET' }, signal)
}

export async function getAppMetrics(id: string, signal?: AbortSignal): Promise<Metrics[]> {
  return request<Metrics[]>(`/apps/${encodeURIComponent(id)}/metrics`, { method: 'GET' }, signal)
}

export async function getPrometheusMetrics(signal?: AbortSignal): Promise<string> {
  const base = getActiveBaseURL()
  if (!base) throw new Error('No active deployer configured')
  const url = joinURL(base, '/metrics')
  const token = getToken()
  const headers: Record<string,string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { method: 'GET', headers, signal })
  if (!res.ok) {
    const body = await parseBody(res)
    throw new ApiError(res.status, body)
  }
  return res.text()
}

export async function getAppLogs(id: string, params?: LogParams, signal?: AbortSignal) {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params as Record<string, any>).filter(([,v])=>v!=null).map(([k,v])=>[k,String(v)])) : ''
  return request(`/apps/${encodeURIComponent(id)}/logs${qs}`, { method: 'GET' }, signal)
}

export function streamAppLogs(id: string, onMessage: (ev: MessageEvent) => void, onError?: (ev: Event) => void) {
  const base = getActiveBaseURL()
  if (!base) throw new Error('No active deployer configured')
  const token = getToken()
  const url = joinURL(base, `/apps/${encodeURIComponent(id)}/logs/stream`)
  // EventSource doesn't support custom headers; attach token as query param when needed
  const finalUrl = token ? `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : url
  if (typeof EventSource === 'undefined') {
    throw new Error('EventSource not available in this environment')
  }
  const es = new EventSource(finalUrl)
  es.onmessage = onMessage
  if (onError) es.onerror = onError
  return {
    es,
    close: () => es.close(),
  }
}

export async function getDeployments(appId: string, signal?: AbortSignal): Promise<Deployment[]> {
  return request<Deployment[]>(`/apps/${encodeURIComponent(appId)}/deployments`, { method: 'GET' }, signal)
}

export async function getAppEnv(appId: string, signal?: AbortSignal): Promise<Record<string,string>> {
  return request<Record<string,string>>(`/apps/${encodeURIComponent(appId)}/env`, { method: 'GET' }, signal)
}

export async function putAppEnv(appId: string, body: Record<string,string>, signal?: AbortSignal): Promise<Record<string,string>> {
  return request<Record<string,string>>(`/apps/${encodeURIComponent(appId)}/env`, { method: 'PUT', body }, signal)
}

export async function deleteAppEnv(appId: string, key: string, signal?: AbortSignal): Promise<void> {
  return request<void>(`/apps/${encodeURIComponent(appId)}/env/${encodeURIComponent(key)}`, { method: 'DELETE' }, signal)
}

export async function postAppMigrationsRun(appId: string, body: { target?: string } = {}, signal?: AbortSignal): Promise<any> {
  return request(`/apps/${encodeURIComponent(appId)}/migrations/run`, { method: 'POST', body }, signal)
}

export async function deleteApp(id: string, signal?: AbortSignal): Promise<void> {
  return request<void>(`/apps/${encodeURIComponent(id)}`, { method: 'DELETE' }, signal)
}

export async function getDeployment(id: string, signal?: AbortSignal): Promise<Deployment> {
  return request<Deployment>(`/deployments/${encodeURIComponent(id)}`, { method: 'GET' }, signal)
}

export async function getConfigEnv(signal?: AbortSignal) {
  return request('/config/env', { method: 'GET' }, signal)
}

export async function putConfigEnv(body: Record<string,string>, signal?: AbortSignal) {
  return request('/config/env', { method: 'PUT', body }, signal)
}

export async function postSetupSelfUpdate(signal?: AbortSignal) {
  return request('/setup/self-update', { method: 'POST' }, signal)
}

// -----------------------------------------------------------------------------
// New API wrappers for Phase 1 (typed): versions, scheduling, shutdown, registry test
// These will fall back to lightweight dev-mode mocks when the flag
// `localStorage['deployer:useDevMocks'] === '1'` is set or when the real request
// fails (to allow offline UI work). See docs/API_CONTRACT.md for assumptions.
// -----------------------------------------------------------------------------

function useDevMocks(): boolean {
  try {
    return typeof window !== 'undefined' && localStorage.getItem('deployer:useDevMocks') === '1'
  } catch (e) {
    return false
  }
}

export async function getAppVersions(appId: string, signal?: AbortSignal): Promise<AppVersion[]> {
  try {
    return await request<AppVersion[]>(`/apps/${encodeURIComponent(appId)}/versions`, { method: 'GET' }, signal)
  } catch (err) {
    if (useDevMocks()) {
      const now = new Date().toISOString()
      const mock: AppVersion[] = [
        { id: 'v-1', appId, version: '1.0.0', createdAt: now, notes: 'Initial (mock)' },
        { id: 'v-2', appId, version: '1.1.0', createdAt: now, notes: 'Latest upstream (mock)', upstream: true }
      ]
      return mock
    }
    throw err
  }
}

export async function getAppVersion(appId: string, versionId: string, signal?: AbortSignal): Promise<AppVersion> {
  try {
    return await request<AppVersion>(`/apps/${encodeURIComponent(appId)}/versions/${encodeURIComponent(versionId)}`, { method: 'GET' }, signal)
  } catch (err) {
    if (useDevMocks()) {
      return { id: versionId, appId, version: versionId, createdAt: new Date().toISOString(), notes: 'mocked version' }
    }
    throw err
  }
}

export async function postAppSchedule(appId: string, body: ScheduleConfig, signal?: AbortSignal): Promise<void | ServerResponse> {
  try {
    return await request<void | ServerResponse>(`/apps/${encodeURIComponent(appId)}/schedule`, { method: 'POST', body }, signal)
  } catch (err) {
    if (useDevMocks()) {
      return { ok: true, message: 'Mock schedule accepted' }
    }
    throw err
  }
}

export async function postAppShutdown(appId: string, signal?: AbortSignal): Promise<void | ServerResponse> {
  try {
    return await request<void | ServerResponse>(`/apps/${encodeURIComponent(appId)}/shutdown`, { method: 'POST' }, signal)
  } catch (err) {
    if (useDevMocks()) {
      return { ok: true, message: 'Mock shutdown triggered' }
    }
    throw err
  }
}

export async function postAppRegistryTest(appId: string, body: { registryUrl: string; credentials: RegistryAuth }, signal?: AbortSignal): Promise<{ ok: boolean; message?: string }> {
  try {
    return await request<{ ok: boolean; message?: string }>(`/apps/${encodeURIComponent(appId)}/registry/test`, { method: 'POST', body }, signal)
  } catch (err) {
    if (useDevMocks()) {
      // Simple heuristics for mock responses
      if (body.registryUrl && body.credentials) return { ok: true, message: 'Mock: registry reachable' }
      return { ok: false, message: 'Mock: missing registry or credentials' }
    }
    throw err
  }
}

export { ApiError }
