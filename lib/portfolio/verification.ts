import crypto from "crypto"

const SECRET =
  process.env.PORTFOLIO_VERIFICATION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "development-secret-change-me"

export function createVerificationCode(userId: string) {
  const timestamp = Date.now().toString()

  const payload = `${userId}.${timestamp}`

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")

  return Buffer.from(`${payload}.${signature}`).toString("base64url")
}

export function verifyVerificationCode(code: string) {
  try {
    const decoded = Buffer.from(code, "base64url").toString("utf8")

    const parts = decoded.split(".")

    if (parts.length !== 3) {
      return null
    }

    const [userId, timestamp, signature] = parts

    const payload = `${userId}.${timestamp}`

    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("hex")

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )

    if (!valid) {
      return null
    }

    return {
      userId,
      timestamp: Number(timestamp),
    }
  } catch {
    return null
  }
}