import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { getEnabledWelcomeSettings, welcomeStorageAvailable } from "@/lib/welcome-settings"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function verifySignature(body: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha256=")) return false
  const supplied = Buffer.from(header.slice(7), "hex")
  const expected = createHmac("sha256", secret).update(body).digest()
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}

export async function POST(request: Request) {
  const secret = process.env.YAPPER_WEBHOOK_SECRET
  const botToken = process.env.YAPPER_BOT_TOKEN
  if (!secret || !botToken || !welcomeStorageAvailable()) {
    return NextResponse.json({ error: "Event webhook is not configured." }, { status: 503 })
  }

  const body = await request.text()
  if (!verifySignature(body, request.headers.get("x-yapper-signature"), secret)) {
    return NextResponse.json({ error: "Invalid event signature." }, { status: 401 })
  }

  let event: unknown
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 })
  }
  if (!event || typeof event !== "object") return NextResponse.json({ error: "Invalid event payload." }, { status: 400 })

  const envelope = event as Record<string, unknown>
  if (envelope.event !== "member_join") return NextResponse.json({ ok: true, ignored: true })
  if (!envelope.data || typeof envelope.data !== "object") return NextResponse.json({ error: "Invalid member_join event." }, { status: 400 })

  const data = envelope.data as Record<string, unknown>
  const serverId = data.server_id
  const userId = data.user_id
  if (typeof serverId !== "string" || !uuidPattern.test(serverId) || typeof userId !== "string" || !uuidPattern.test(userId)) {
    return NextResponse.json({ error: "Invalid member_join identifiers." }, { status: 400 })
  }

  try {
    const settings = await getEnabledWelcomeSettings(serverId)
    if (!settings) return NextResponse.json({ ok: true, skipped: true })

    const username = typeof data.username === "string" ? data.username : "there"
    const memberCount = typeof data.member_count === "number" ? String(data.member_count) : ""
    const content = settings.message
      .replaceAll("{{mention}}", `<@${userId}>`)
      .replaceAll("{{username}}", username)
      .replaceAll("{{member_count}}", memberCount)

    const response = await fetch(
      `https://bots.yapper.website/api/bot/v1/channels/${encodeURIComponent(settings.channelId)}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    )
    if (!response.ok) return NextResponse.json({ error: "Yapin could not send the welcome message." }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Could not process the welcome event." }, { status: 503 })
  }
}