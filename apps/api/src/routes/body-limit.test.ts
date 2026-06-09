import assert from "node:assert/strict"
import test from "node:test"

import { AppError } from "../lib/errors"

// Constants matching those in the route files
const MAX_INGEST_BODY_SIZE = 1_048_576 // 1MB
const MAX_SOURCEMAP_BODY_SIZE = 52_428_800 // 50MB

function checkBodySize(contentLengthHeader: string | null, maxSize: number): void {
  const contentLength = parseInt(contentLengthHeader ?? "0", 10)
  if (contentLength > maxSize) {
    throw new AppError({
      code: "payload_too_large",
      message: "Request body exceeds size limit",
      statusCode: 413
    })
  }
}

test("body size check rejects Content-Length > 1MB with 413", () => {
  try {
    checkBodySize(String(MAX_INGEST_BODY_SIZE + 1), MAX_INGEST_BODY_SIZE)
    assert.fail("Expected AppError to be thrown")
  } catch (error) {
    assert.ok(error instanceof AppError)
    if (error instanceof AppError) {
      assert.equal(error.statusCode, 413)
      assert.equal(error.code, "payload_too_large")
    }
  }
})

test("body size check allows Content-Length <= 1MB", () => {
  assert.doesNotThrow(() => {
    checkBodySize(String(MAX_INGEST_BODY_SIZE), MAX_INGEST_BODY_SIZE)
  })
})

test("body size check allows Content-Length of 1 byte under 1MB", () => {
  assert.doesNotThrow(() => {
    checkBodySize(String(MAX_INGEST_BODY_SIZE - 1), MAX_INGEST_BODY_SIZE)
  })
})

test("body size check rejects Content-Length > 50MB with 413 for sourcemaps", () => {
  try {
    checkBodySize(String(MAX_SOURCEMAP_BODY_SIZE + 1), MAX_SOURCEMAP_BODY_SIZE)
    assert.fail("Expected AppError to be thrown")
  } catch (error) {
    assert.ok(error instanceof AppError)
    if (error instanceof AppError) {
      assert.equal(error.statusCode, 413)
      assert.equal(error.code, "payload_too_large")
    }
  }
})

test("body size check allows Content-Length <= 50MB for sourcemaps", () => {
  assert.doesNotThrow(() => {
    checkBodySize(String(MAX_SOURCEMAP_BODY_SIZE), MAX_SOURCEMAP_BODY_SIZE)
  })
})

test("body size check handles missing Content-Length header", () => {
  assert.doesNotThrow(() => {
    checkBodySize(null, MAX_INGEST_BODY_SIZE)
  })
})

test("body size check handles invalid Content-Length header", () => {
  assert.doesNotThrow(() => {
    checkBodySize("invalid", MAX_INGEST_BODY_SIZE)
  })
})
