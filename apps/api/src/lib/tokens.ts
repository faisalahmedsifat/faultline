import { randomBytes } from "node:crypto"

const URL_SAFE_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

export function createToken(length: number) {
  const bytes = randomBytes(length)
  let token = ""

  for (let index = 0; index < length; index += 1) {
    token += URL_SAFE_ALPHABET[bytes[index] % URL_SAFE_ALPHABET.length]
  }

  return token
}

