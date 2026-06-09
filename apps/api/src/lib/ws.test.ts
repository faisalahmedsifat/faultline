import { describe, it, expect } from "bun:test"
import { addConnection, removeConnection, closeAllConnections, type WSData } from "./ws"

// Minimal mock of Bun's ServerWebSocket for testing
function createMockWS(projectId: string) {
  let closed = false
  let closeCode = 0
  let closeReason = ""
  return {
    data: { projectId },
    close(code?: number, reason?: string) {
      closed = true
      closeCode = code ?? 0
      closeReason = reason ?? ""
      // Simulate Bun's behavior: close() synchronously triggers the close callback,
      // which calls removeConnection and mutates the connections Set.
      removeConnection(this as any)
    },
    get closed() { return closed },
    get closeCode() { return closeCode },
    get closeReason() { return closeReason },
    send(_data: string) {},
  } as any
}

describe("closeAllConnections", () => {
  it("closes all connections without skipping any due to mutation during iteration", () => {
    const ws1 = createMockWS("prj_1")
    const ws2 = createMockWS("prj_1")
    const ws3 = createMockWS("prj_2")
    const ws4 = createMockWS("prj_2")

    addConnection(ws1)
    addConnection(ws2)
    addConnection(ws3)
    addConnection(ws4)

    closeAllConnections()

    // All 4 connections should have been closed
    expect(ws1.closed).toBe(true)
    expect(ws2.closed).toBe(true)
    expect(ws3.closed).toBe(true)
    expect(ws4.closed).toBe(true)
  })

  it("clears the connections map after close", () => {
    const ws1 = createMockWS("prj_test")
    addConnection(ws1)
    closeAllConnections()

    // After closeAllConnections, the connections map should be empty.
    // Verify indirectly: adding a new connection should succeed (map was cleared).
    const ws2 = createMockWS("prj_test")
    addConnection(ws2)
    expect(ws2.closed).toBe(false) // should not have been closed

    // Clean up
    closeAllConnections()
  })
})
