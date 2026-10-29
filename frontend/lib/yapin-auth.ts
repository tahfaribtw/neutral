import { createHmac, timingSafeEqual } from "node:crypto"

export const SESSION_COOKIE = "yapin_session"
export const STATE_COOKIE = "yapin_oauth_state"

export type YapperUser = {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

type Session = {
  user: YapperUser
  expiresAt: number
}

function sessionSecret() {
  const secret = process.env.YAPPER_SESSION_SECRET
  return secret && secret.length >= 32 ? secret : null
}

export function isOAuthConfigured() {
  return Boolean(
    process.env.YAPPER_CLIENT_ID &&
      process.env.YAPPER_CLIENT_SECRET &&
      process.env.YAPPER_REDIRECT_URI &&
      sessionSecret(),
  )
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url")
}

export function createSession(user: YapperUser) {
  const secret = sessionSecret()
  if (!secret) throw new Error("YAPPER_SESSION_SECRET is not configured")

  const payload = Buffer.from(
    JSON.stringify({ user, expiresAt: Date.now() + 12 * 60 * 60 * 1000 }),
  ).toString("base64url")

  return `${payload}.${signature(payload, secret)}`
}

export function readSession(value?: string): YapperUser | null {
  const secret = sessionSecret()
  if (!secret || !value) return null

  const [payload, providedSignature] = value.split(".")
  if (!payload || !providedSignature) return null

  const expected = Buffer.from(signature(payload, secret))
  const provided = Buffer.from(providedSignature)
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Session

    if (
      session.expiresAt <= Date.now() ||
      typeof session.user?.id !== "string" ||
      typeof session.user?.username !== "string"
    ) {
      return null
    }

    return session.user
  } catch {
    return null
  }
}