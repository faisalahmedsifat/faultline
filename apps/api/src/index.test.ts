import assert from "node:assert/strict"
import test from "node:test"

/**
 * Extracted Origin validation logic mirroring index.ts WebSocket upgrade handler.
 * Tests that CORS_ORIGIN origin checking is correct.
 */
function shouldAllowUpgrade(origin: string | null, corsOrigin: string | undefined): boolean {
  if (corsOrigin) {
    if (origin !== corsOrigin) {
      return false
    }
  }
  return true
}

test("allows WebSocket upgrade when CORS_ORIGIN is not configured (backward compatible)", () => {
  assert.equal(shouldAllowUpgrade("https://evil.com", undefined), true)
  assert.equal(shouldAllowUpgrade(null, undefined), true)
})

test("allows WebSocket upgrade when Origin matches CORS_ORIGIN", () => {
  assert.equal(shouldAllowUpgrade("https://myapp.com", "https://myapp.com"), true)
})

test("rejects WebSocket upgrade when Origin does not match CORS_ORIGIN", () => {
  assert.equal(shouldAllowUpgrade("https://evil.com", "https://myapp.com"), false)
})

test("rejects WebSocket upgrade when Origin is null and CORS_ORIGIN is configured", () => {
  assert.equal(shouldAllowUpgrade(null, "https://myapp.com"), false)
})
