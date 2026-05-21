import { createHash } from "node:crypto"

export type FingerprintPayload = {
  title: string
  file?: string | null
  line?: number | null
  message?: string | null
}

export function fingerprint(payload: FingerprintPayload) {
  const { title, file, line, message } = payload

  if (file && typeof line === "number") {
    return createHash("sha256").update(`${title}:${file}:${line}`).digest("hex").slice(0, 32)
  }

  return createHash("sha256")
    .update(`${title}:${message?.slice(0, 100) ?? ""}`)
    .digest("hex")
    .slice(0, 32)
}

