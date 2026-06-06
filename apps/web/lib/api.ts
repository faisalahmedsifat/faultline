const API_BASE = process.env.API_URL ?? "http://localhost:4000"

// ---- Types ----

export type ProjectDto = {
  id: string
  name: string
  dsnKey: string
  dsn: string
  createdAt: string
}

export type ErrorListItemDto = {
  id: string
  projectId: string
  title: string
  message: string | null
  route: string | null
  file: string | null
  line: number | null
  env: string | null
  level: string | null
  status: "open" | "ignored" | "resolved"
  count: number
  userCount: number
  firstSeen: string
  lastSeen: string
}

export type ErrorDetailDto = ErrorListItemDto & {
  fingerprint: string
  stack: string | null
  col: number | null
  metadata: Record<string, unknown> | null
  users: string[]
}

export type AlertDto = {
  id: string
  channel: "slack" | "email" | "discord"
  destination: string
  threshold: number
  enabled: boolean
}

export type ErrorStatus = "open" | "ignored" | "resolved"

export type AlertChannel = "slack" | "email" | "discord"

export type AlertInput = {
  channel: AlertChannel
  destination: string
  threshold: number
  enabled: boolean
}

type ErrorFilters = {
  status?: ErrorStatus
  env?: string
}

// ---- Internal ----

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const error = body?.error
    throw new Error(error?.message ?? `Request failed with status ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ---- Projects ----

export async function getProjects(): Promise<{ projects: ProjectDto[] }> {
  return request("/api/projects")
}

export async function createProject(name: string): Promise<{ project: ProjectDto }> {
  return request("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name })
  })
}

export async function rotateDsn(projectId: string): Promise<{ project: ProjectDto }> {
  return request(`/api/projects/${projectId}/rotate-dsn`, { method: "PUT" })
}

export async function deleteProject(projectId: string): Promise<void> {
  return request(`/api/projects/${projectId}`, { method: "DELETE" })
}

// ---- Errors ----

export async function getErrors(
  projectId: string,
  filters?: ErrorFilters & { page?: number; pageSize?: number }
): Promise<{
  projectId: string
  filters: { status: string | null; env: string | null }
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
  errors: ErrorListItemDto[]
}> {
  const params = new URLSearchParams({ projectId })
  if (filters?.status) params.set("status", filters.status)
  if (filters?.env) params.set("env", filters.env)
  if (filters?.page) params.set("page", String(filters.page))
  if (filters?.pageSize) params.set("pageSize", String(filters.pageSize))

  return request(`/api/errors?${params}`)
}

export async function getError(errorId: string): Promise<{ error: ErrorDetailDto }> {
  return request(`/api/errors/${errorId}`)
}

export async function updateErrorStatus(
  errorId: string,
  status: ErrorStatus
): Promise<{ error: ErrorListItemDto }> {
  return request(`/api/errors/${errorId}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  })
}

// ---- Alerts ----

export async function getAlerts(
  projectId: string
): Promise<{ projectId: string; alerts: AlertDto[] }> {
  return request(`/api/alerts?projectId=${encodeURIComponent(projectId)}`)
}

export async function replaceAlerts(
  projectId: string,
  alerts: AlertInput[]
): Promise<{ projectId: string; alerts: AlertDto[] }> {
  return request("/api/alerts", {
    method: "PUT",
    body: JSON.stringify({ projectId, alerts })
  })
}
