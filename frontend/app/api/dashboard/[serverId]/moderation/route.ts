import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  getOwnedBotServer,
  moderateBotServer,
  TIMEOUT_MAX_MINUTES,
  type ModerationAction,
} from "@/lib/yapin-servers"
import { readSession, SESSION_COOKIE } from "@/lib/yapin-auth"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  { params }: { params: Promise<{ serverId: string }> },
) {
  const { serverId } = await params
  if (!uuidPattern.test(serverId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const origin = request.headers.get("origin")
  const requestHost = request.headers.get("host")
  if (origin && requestHost && new URL(origin).host !== requestHost) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

  const cookieStore = await cookies()
  const user = readSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!user) {
    return NextResponse.json({ error: "Sign in again to continue." }, { status: 401 })
  }

  const server = await getOwnedBotServer(serverId, user.id)
  if (!server) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const action = formData.get("action")
  const userId = formData.get("user_id")
  const actions: ModerationAction[] = ["kick", "ban", "unban", "timeout", "untimeout"]
  if (
    typeof action !== "string" ||
    !actions.includes(action as ModerationAction) ||
    typeof userId !== "string" ||
    !uuidPattern.test(userId)
  ) {
    return NextResponse.json({ error: "Invalid moderation request" }, { status: 400 })
  }
  const moderationAction = action as ModerationAction
  if (moderationAction !== "unban" && userId === server.ownerId) {
    return NextResponse.json({ error: "The server owner cannot be moderated here" }, { status: 400 })
  }

  let minutes: number | undefined
  let reason: string | undefined
  if (moderationAction === "timeout") {
    const rawMinutes = formData.get("minutes")
    const parsed = typeof rawMinutes === "string" ? Number(rawMinutes) : NaN
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > TIMEOUT_MAX_MINUTES) {
      return NextResponse.json({ error: "Timeout must be between 1 and 40320 minutes" }, { status: 400 })
    }
    minutes = parsed
    const rawReason = formData.get("reason")
    if (typeof rawReason === "string" && rawReason.trim()) {
      reason = rawReason.trim().slice(0, 200)
    }
  }

  const success = await moderateBotServer(serverId, moderationAction, userId, { minutes, reason })
  if (!success) {
    return NextResponse.json(
      { error: "The bot could not complete this moderation action." },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, action })
}