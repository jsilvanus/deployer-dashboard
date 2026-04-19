export type ID = string

export type EnvVar = {
  key: string
  value: string
  secret?: boolean
}

export type Status = 'running' | 'stopped' | 'failed' | 'updating' | 'unknown'

export type Metrics = {
  cpu: number // percent
  memory: number // bytes
  timestamp: string
}

// App represents an application registered in the deployer.
// NOTE: Phase 0 additions per PHASEPLAN.md — new optional fields below.
export type App = {
  id: ID
  name: string
  type: string
  image?: string
  version?: string
  status: Status
  createdAt?: string
  env?: EnvVar[]

  // Phase 0 additions (optional):
  registryUrl?: string
  registryAuth?: RegistryAuth
  cors?: CorsConfig
  lastModified?: string // ISO timestamp from server
  schedule?: ScheduleConfig
}

export type DeploymentStep = {
  name: string
  status: 'pending' | 'running' | 'success' | 'failed'
  startedAt?: string
  finishedAt?: string
}

export type Deployment = {
  id: ID
  appId: ID
  status: 'pending' | 'running' | 'success' | 'failed'
  steps: DeploymentStep[]
  createdAt?: string
  finishedAt?: string
}

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown) {
    super(`API Error ${status}`)
    this.status = status
    this.body = body
  }
}

export type LogParams = {
  limit?: number
  tail?: boolean
  level?: string
  since?: string
}

// -----------------------------------------------------------------------------
// Phase 0 types: minimal explicit types added to support new UI features.
// See PHASEPLAN.md (Phase 0) for rationale.
// -----------------------------------------------------------------------------

// Authentication/credentials for registries. Keep client-side shape minimal;
// the UI SHOULD NOT persist plaintext credentials long-term. Server-side
// storage is recommended.
export type RegistryAuth = {
  type: 'none' | 'token' | 'basic'
  token?: string
  username?: string
  password?: string
}

export type CorsConfig = {
  enabled?: boolean
  allowedOrigins?: string[]
  allowCredentials?: boolean
}

// ScheduleConfig is deliberately small: UI will send cron + timezone and server
// validates/normalizes it. `nextRun` is provided by server for display.
export type ScheduleConfig = {
  enabled?: boolean
  cron?: string
  timezone?: string
  nextRun?: string
}

// AppVersion represents a single version entry from upstream or history.
export type AppVersion = {
  id: ID
  appId: ID
  version: string
  createdAt?: string
  notes?: string
  upstream?: boolean
  metadata?: Record<string, unknown>
}

// Generic server response shorthand used by some endpoints.
export type ServerResponse = {
  ok: boolean
  message?: string
  [k: string]: unknown
}
