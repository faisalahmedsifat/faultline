import { SourceMapConsumer } from "source-map"
import { getSourceMapStore } from "./sourcemap-store"
import { parseStack, parseSentryFrames, type ParsedFrame } from "./parse-stack"
import { db } from "../db/client"
import { errors } from "../db/schema"
import { eq } from "drizzle-orm"

export type ResolvedFrame = {
  file: string
  line: number
  col: number
  fn: string
  sourceContext: string | null
}

/**
 * Resolve minified stack frames to original source using stored source maps.
 * Results are cached in errors.resolvedStack after first resolution.
 */
export async function resolveStack(
  errorId: string,
  projectId: string,
  stack: string,
  release: string | null
): Promise<ResolvedFrame[]> {
  // Check cache first
  const [row] = await db
    .select({ resolvedStack: errors.resolvedStack })
    .from(errors)
    .where(eq(errors.id, errorId))
    .limit(1)

  if (row?.resolvedStack) {
    return row.resolvedStack as ResolvedFrame[]
  }

  // No cache — resolve from source maps
  if (!release) return []

  const frames = parseStack(stack)
  const resolved = await resolveFrames(frames, projectId, release)

  // Cache the result
  await db
    .update(errors)
    .set({ resolvedStack: resolved as unknown as Record<string, unknown>[] })
    .where(eq(errors.id, errorId))

  return resolved
}

/**
 * Resolve Sentry-normalized frames (pre-parsed, no stack string needed).
 */
export async function resolveSentryFrames(
  errorId: string,
  projectId: string,
  sentryFrames: Array<{
    filename?: string
    abs_path?: string
    function?: string
    lineno?: number
    colno?: number
  }>,
  release: string | null
): Promise<ResolvedFrame[]> {
  const [row] = await db
    .select({ resolvedStack: errors.resolvedStack })
    .from(errors)
    .where(eq(errors.id, errorId))
    .limit(1)

  if (row?.resolvedStack) {
    return row.resolvedStack as ResolvedFrame[]
  }

  if (!release) return []

  const frames = parseSentryFrames(sentryFrames)
  const resolved = await resolveFrames(frames, projectId, release)

  await db
    .update(errors)
    .set({ resolvedStack: resolved as unknown as Record<string, unknown>[] })
    .where(eq(errors.id, errorId))

  return resolved
}

async function resolveFrames(
  frames: ParsedFrame[],
  projectId: string,
  release: string
): Promise<ResolvedFrame[]> {
  const store = getSourceMapStore()
  const resolved: ResolvedFrame[] = []

  for (const frame of frames) {
    try {
      const mapFile = `${frame.file}.map`
      const raw = await store.get(projectId, release, mapFile)
      if (!raw) {
        resolved.push({ ...frame, sourceContext: null })
        continue
      }

      const consumer = await new SourceMapConsumer(JSON.parse(raw.toString("utf-8")))
      const pos = consumer.originalPositionFor({ line: frame.line, column: frame.col })

      let sourceContext: string | null = null
      if (pos.source && pos.line) {
        const content = consumer.sourceContentFor(pos.source)
        if (content) {
          const lines = content.split("\n")
          const start = Math.max(0, pos.line - 4)
          const end = Math.min(lines.length, pos.line + 3)
          sourceContext = lines.slice(start, end)
            .map((l, i) => `${start + i + 1}: ${l}`)
            .join("\n")
        }
      }

      resolved.push({
        file: pos.source ?? frame.file,
        line: pos.line ?? frame.line,
        col: pos.column ?? frame.col,
        fn: pos.name ?? frame.fn,
        sourceContext
      })

      consumer.destroy()
    } catch {
      resolved.push({ ...frame, sourceContext: null })
    }
  }

  return resolved
}
