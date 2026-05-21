import { randomBytes } from "node:crypto"

export function createId(prefix: string) {
  const suffix = randomBytes(9).toString("base64url").slice(0, 12)
  return `${prefix}_${suffix}`
}

