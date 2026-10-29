import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import {
  createSession,
  isOAuthConfigured,
  SESSION_COOKIE,
  STATE_COOKIE,
  type YapperUser,
} from "@/lib/yapin-auth"

type TokenResponse = { access_token?: string }
type ProfileResponse = {
  id?: string
  username?: string
  display_name?: string | null
  avatar_url?: string | null
}

function matchesState(left: string, right: string) {
  const leftBytes = Buffer.from(left)
  const rightBytes = Buffer.from(right)
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes)
}

function clearStateCookie(response: NextResponse) {
  response.cookies.set(STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const destination = new URL("/", request.url)
  const state = url.searchParams.get("state")
  const stateCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1)

  if (url.searchParams.has("error")) {
    destination.searchParams.set("error", "cancelled")
    const response = NextResponse.redirect(destination)
    clearStateCookie(response)
    return response
  }

  if (!isOAuthConfigured() || !state || !stateCookie || !matchesState(state, stateCookie)) {
    destination.searchParams.set("error", "login")
    const response = NextResponse.redirect(destination)
    clearStateCookie(response)
    return response
  }

  const code = url.searchParams.get("code")
  if (!code) {
    destination.searchParams.set("error", "login")
    const response = NextResponse.redirect(destination)
    clearStateCookie(response)
    return response
  }

  try {
    const tokenResponse = await fetch("https://www.yapin.gg/api/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.YAPPER_REDIRECT_URI!,
        client_id: process.env.YAPPER_CLIENT_ID!,
        client_secret: process.env.YAPPER_CLIENT_SECRET!,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    const tokenData = (await tokenResponse.json()) as TokenResponse
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error("Token exchange failed")

    const profileResponse = await fetch("https://www.yapin.gg/api/oauth/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    const profile = (await profileResponse.json()) as ProfileResponse
    if (
      !profileResponse.ok ||
      typeof profile.id !== "string" ||
      typeof profile.username !== "string"
    ) {
      throw new Error("Profile request failed")
    }

    const user: YapperUser = {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name ?? null,
      avatarUrl: profile.avatar_url ?? null,
    }
    const response = NextResponse.redirect(destination)
    response.cookies.set(SESSION_COOKIE, createSession(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60,
    })
    clearStateCookie(response)
    return response
  } catch {
    destination.searchParams.set("error", "login")
    const response = NextResponse.redirect(destination)
    clearStateCookie(response)
    return response
  }
}