import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"

import { getPublicAppUrl, isOAuthConfigured, STATE_COOKIE } from "@/lib/yapin-auth"

export async function GET(request: Request) {
  if (!isOAuthConfigured()) {
    return NextResponse.redirect(getPublicAppUrl("/?error=setup", request.url))
  }

  const state = randomBytes(32).toString("base64url")
  const authorizeUrl = new URL("https://www.yapin.gg/oauth/authorize")
  authorizeUrl.searchParams.set("client_id", process.env.YAPPER_CLIENT_ID!)
  authorizeUrl.searchParams.set("redirect_uri", process.env.YAPPER_REDIRECT_URI!)
  authorizeUrl.searchParams.set("response_type", "code")
  authorizeUrl.searchParams.set("scope", "identify")
  authorizeUrl.searchParams.set("state", state)

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  })

  return response
}