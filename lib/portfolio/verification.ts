import crypto from "node:crypto"

/** Codes are random, URL-safe bearer tokens. Only their SHA-256 hashes are persisted. */
export function createVerificationCode() {
  return crypto.randomBytes(24).toString("base64url")
}

export function hashVerificationCode(code: string) {
  return crypto.createHash("sha256").update(code.trim()).digest("hex")
}

export function validVerificationCodeShape(code: string) {
  return /^[A-Za-z0-9_-]{32}$/.test(code)
}
