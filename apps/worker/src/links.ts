import { env } from "./env"

export function buildErrorUrl(projectId: string, errorId: string) {
  return new URL(`/projects/${projectId}/errors/${errorId}`, env.APP_BASE_URL).toString()
}

