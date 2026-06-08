import assert from "node:assert/strict"
import test from "node:test"

import { buildSentryDsnUrl } from "./project"

test("buildSentryDsnUrl generates Sentry-compatible DSN format", () => {
  const dsn = buildSentryDsnUrl("abc123", "prj_xyz")

  // Format should be: https://{dsnKey}@{host}/{projectId}
  assert.match(dsn, /^https:\/\/abc123@.+\/prj_xyz$/)
})

test("buildSentryDsnUrl includes the real project ID in the DSN path", () => {
  const dsn = buildSentryDsnUrl("key", "prj_myproject")

  assert.ok(dsn.endsWith("/prj_myproject"))
})

test("buildSentryDsnUrl uses the dsnKey as the auth user", () => {
  const dsn = buildSentryDsnUrl("my-token-hash", "prj_1")

  assert.ok(dsn.startsWith("https://my-token-hash@"))
})

test("buildSentryDsnUrl produces valid URI with no duplicate protocol", () => {
  const dsn = buildSentryDsnUrl("key", "prj_1")

  // Should only have https:// once
  const matches = dsn.match(/https:\/\//g)
  assert.equal(matches?.length, 1)
})
