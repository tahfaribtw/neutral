import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  getOwnedBotServer,
  getServerChannelData,
  manageBotServerChannel,
  type ChannelManagementAction,
} from "@/lib/yapin-servers"
import { readSession, SESSION_COOKIE } from "@/lib/yapin-auth"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const channelActions: ChannelManagementAction[] = ["rename-channel", "delete-channel"]
const categoryActions: ChannelManagementAction[] = ["rename-category", "delete-category"]
const allActions = [...channelActions, ...categoryActions]

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
  try {
    if (origin && requestHost && new URL(origin).host !== requestHost) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

  const cookieStore = await cookies()
  const user = readSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!user) {
    return NextResponse.json({ error: "Sign in again to continue." }, { status: 401 })
  }

  const server = await getOwnedBotServer(serverId, user.id)
  if (!server) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const action = formData.get("action")
  const targetId = formData.get("target_id")
  const name = formData.get("name")
  if (
    typeof action !== "string" ||
    !allActions.includes(action as ChannelManagementAction) ||
    typeof targetId !== "string" ||
    !uuidPattern.test(targetId)
  ) {
    return NextResponse.json({ error: "Invalid channel request" }, { status: 400 })
  }

  const typedAction = action as ChannelManagementAction
  const isChannel = channelActions.includes(typedAction)
  const renaming = typedAction.startsWith("rename")
  const normalizedName = typeof name === "string" ? name.trim() : ""
  if (renaming && (!normalizedName || normalizedName.length > 100)) {
    return NextResponse.json({ error: "Names must be between 1 and 100 characters." }, { status: 400 })
  }

  const channelData = await getServerChannelData(serverId)
  if (channelData.error) {
    return NextResponse.json({ error: "Could not verify this server’s channels." }, { status: 503 })
  }

  const targetExists = isChannel
    ? channelData.channels.some((channel) => channel.id === targetId)
    : channelData.categories.some((category) => category.id === targetId)
  if (!targetExists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const success = await manageBotServerChannel(
    serverId,
    targetId,
    typedAction,
    renaming ? normalizedName : undefined,
  )
  if (!success) {
    return NextResponse.json(
      { error: "The bot could not complete this channel action." },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, action: typedAction })
}