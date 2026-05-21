import assert from "node:assert/strict"
import test from "node:test"

import { fingerprint } from "./fingerprint"

test("fingerprint is stable for the same title, file, and line", () => {
  const first = fingerprint({
    title: "TypeError",
    file: "src/executor/GhostEngine.ts",
    line: 142,
    message: "Cannot read properties of undefined"
  })

  const second = fingerprint({
    title: "TypeError",
    file: "src/executor/GhostEngine.ts",
    line: 142,
    message: "Something else entirely"
  })

  assert.equal(first, second)
})

test("fingerprint falls back to title and truncated message when file or line is missing", () => {
  const longMessage = "a".repeat(150)

  const first = fingerprint({
    title: "ReferenceError",
    message: longMessage
  })

  const second = fingerprint({
    title: "ReferenceError",
    message: `${"a".repeat(100)}tail-changes-do-not-matter`
  })

  assert.equal(first, second)
})

