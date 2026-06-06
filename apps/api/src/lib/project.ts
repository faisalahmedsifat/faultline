import { env } from "./env"

export function buildDsnUrl(dsnKey: string) {
  const base = env.INGEST_BASE_URL ?? env.APP_BASE_URL
  return new URL(`/ingest/${dsnKey}`, base).toString()
}

