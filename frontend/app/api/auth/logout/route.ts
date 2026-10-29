import { NextResponse } from "next/server"

import { SESSION_COOKIE } from "@/lib/yapin-auth"

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url))
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return response
}