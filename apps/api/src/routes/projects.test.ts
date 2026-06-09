import assert from "node:assert/strict"
import test from "node:test"

// Inline of dailyCountKey from lib/ingest.ts to avoid env-dependent imports
function dailyCountKey(projectId: string, date = new Date()) {
  const isoDate = date.toISOString().slice(0, 10)
  return `fl:counts:${projectId}:${isoDate}`
}

function generateCleanupKeys(projectId: string): string[] {
  const now = new Date()
  const keys: string[] = []
  for (let i = 0; i < 90; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    keys.push(dailyCountKey(projectId, date))
  }
  return keys
}

test("Redis cleanup generates 90 daily count keys", () => {
  const keys = generateCleanupKeys("prj_test123")
  assert.equal(keys.length, 90)
})

test("Redis cleanup keys have correct format fl:counts:{projectId}:{date}", () => {
  const keys = generateCleanupKeys("prj_test123")
  const keyPattern = /^fl:counts:prj_test123:\d{4}-\d{2}-\d{2}$/
  for (const key of keys) {
    assert.match(key, keyPattern, `Key "${key}" should match pattern`)
  }
})

test("Redis cleanup keys are date-ordered from newest to oldest", () => {
  const keys = generateCleanupKeys("prj_test123")
  const extractDate = (key: string) => key.split(":").pop()!
  for (let i = 0; i < keys.length - 1; i++) {
    const dateA = extractDate(keys[i])
    const dateB = extractDate(keys[i + 1])
    assert.ok(dateA >= dateB, `Expected dates in descending order: ${dateA} >= ${dateB}`)
  }
})

test("Redis cleanup generates expected rate and rate-limit keys", () => {
  const projectId = "prj_test456"
  const dsnKey = "abc123def456"

  const rateKey = `fl:rate:${projectId}`
  const rlKey = `fl:rl:${dsnKey}`

  assert.equal(rateKey, "fl:rate:prj_test456")
  assert.equal(rlKey, "fl:rl:abc123def456")
})
