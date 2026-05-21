import { env } from "./env"

export function buildDsnUrl(dsnKey: string) {
  return new URL(`/ingest/${dsnKey}`, env.APP_BASE_URL).toString()
}

