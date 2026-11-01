import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getOwnedBotServer, getServerChannelData } from "@/lib/yapin-servers"
import { readSession, SESSION_COOKIE } from "@/lib/yapin-auth"
import { saveWelcomeSettings, welcomeStorageAvailable } from "@/lib/welcome-settings"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  { params }: { params: Promise<{ serverId: string }> },
) {
  const { serverId } = await params
  if (!uuidPattern.test(serverId)) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const origin = request.headers.get("origin")
  const requestHost = request.headers.get("host")
  try {
    if (origin && requestHost && new URL(origin).host !== requestHost) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

  const user = readSession((await cookies()).get(SESSION_COOKIE)?.value)
  if (!user) return NextResponse.json({ error: "Sign in again to continue." }, { status: 401 })
  if (!await getOwnedBotServer(serverId, user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!welcomeStorageAvailable()) {
    return NextResponse.json({ error: "Persistent welcome storage is not configured." }, { status: 503 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid welcome settings." }, { status: 400 })

  const values = payload as Record<string, unknown>
  const enabled = values.enabled
  const channelId = values.channelId
  const message = values.message
  if (
    typeof enabled !== "boolean" ||
    typeof channelId !== "string" ||
    (channelId !== "" && !uuidPattern.test(channelId)) ||
    typeof message !== "string" ||
    message.length > 2000 ||
    (enabled && (!channelId || !message.trim()))
  ) {
    return NextResponse.json({ error: "Choose a text channel and enter a message before enabling welcomes." }, { status: 400 })
  }

  if (channelId) {
    const channelData = await getServerChannelData(serverId)
    if (channelData.error) return NextResponse.json({ error: "Could not verify this server’s channels." }, { status: 503 })
    if (!channelData.channels.some((channel) => channel.id === channelId && channel.kind === "text")) {
      return NextResponse.json({ error: "Choose a text channel from this server." }, { status: 400 })
    }
  }

  try {
    await saveWelcomeSettings(serverId, user.id, {
      enabled,
      channelId,
      message: message.trim(),
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Could not save welcome settings." }, { status: 500 })
  }
}