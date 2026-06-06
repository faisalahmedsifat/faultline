export type ParsedFrame = {
  file: string
  line: number
  col: number
  fn: string
}

/**
 * Parse a raw stack trace string into structured frames.
 * Handles V8 (Node/Bun/Deno), SpiderMonkey (Firefox), and Sentry-normalized formats.
 */
export function parseStack(stack: string): ParsedFrame[] {
  const frames: ParsedFrame[] = []

  for (const line of stack.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // V8: "at fn (file:line:col)" or "at file:line:col"
    const v8 = trimmed.match(
      /^at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/
    )
    if (v8) {
      frames.push({
        fn: v8[1] ?? "<anonymous>",
        file: v8[2],
        line: parseInt(v8[3], 10),
        col: parseInt(v8[4], 10)
      })
      continue
    }

    // SpiderMonkey (Firefox): "fn@file:line:col"
    const sm = trimmed.match(/^(.+?)@(.+?):(\d+):(\d+)$/)
    if (sm) {
      frames.push({
        fn: sm[1],
        file: sm[2],
        line: parseInt(sm[3], 10),
        col: parseInt(sm[4], 10)
      })
      continue
    }

    // Best-effort: try to extract file:line:col from anything
    const loose = trimmed.match(/(.+?):(\d+):(\d+)/)
    if (loose) {
      frames.push({
        fn: "<unknown>",
        file: loose[1],
        line: parseInt(loose[2], 10),
        col: parseInt(loose[3], 10)
      })
    }
  }

  return frames
}

/**
 * Parse Sentry-normalized frames (already structured JSON).
 * Sentry SDKs send frames as an array of { filename, function, lineno, colno }.
 */
export function parseSentryFrames(
  sentryFrames: Array<{
    filename?: string
    abs_path?: string
    function?: string
    lineno?: number
    colno?: number
  }>
): ParsedFrame[] {
  return sentryFrames.map((f) => ({
    fn: f.function ?? "<anonymous>",
    file: f.abs_path ?? f.filename ?? "<unknown>",
    line: f.lineno ?? 0,
    col: f.colno ?? 0
  }))
}
