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

export type App = {
  id: ID
  name: string
  type: string
  image?: string
  version?: string
  status: Status
  createdAt?: string
  env?: EnvVar[]
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
