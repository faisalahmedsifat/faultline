export function dailyCountKey(projectId: string, date = new Date()) {
  const isoDate = date.toISOString().slice(0, 10)
  return `fl:counts:${projectId}:${isoDate}`
}

export function rateCountKey(projectId: string) {
  return `fl:rate:${projectId}`
}

export const DAILY_COUNT_TTL_SECONDS = 60 * 60 * 24 * 90
export const RATE_COUNT_TTL_SECONDS = 60 * 15

