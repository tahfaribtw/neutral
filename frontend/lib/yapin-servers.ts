export type BotServer = {
  id: string
  name: string
  iconUrl: string | null
  ownerId: string | null
}

export type ServerListResult = {
  servers: BotServer[]
  error: "missing-token" | "invalid-token" | "unavailable" | null
}

export type BotMember = {
  id: string
  username: string
  displayName: string | null
  nickname: string | null
  avatarUrl: string | null
}

export type BotBan = {
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: string | null
}

export type ModerationData = {
  members: BotMember[]
  bans: BotBan[]
  membersError: "missing-token" | "unavailable" | null
  bansError: "missing-token" | "unavailable" | null
}

export type BotChannel = {
  id: string
  name: string
  kind: "text" | "voice"
  categoryId: string | null
}

export type BotCategory = {
  id: string
  name: string
}

export type ChannelManagementData = {
  channels: BotChannel[]
  categories: BotCategory[]
  error: "missing-token" | "unavailable" | null
}

export type ChannelManagementAction =
  | "rename-channel"
  | "delete-channel"
  | "rename-category"
  | "delete-category"

const API_BASE = "https://bots.yapper.website/api/bot/v1"

function serverIconUrl(path: unknown) {
  if (typeof path !== "string" || !path) return null
  if (path.startsWith("/")) return `https://www.yapin.gg${path}`
  if (path.startsWith("https://")) return path
  return `https://files.yapper.website/icons/${path}`
}

function profileImageUrl(path: unknown) {
  if (typeof path !== "string" || !path) return null
  if (path.startsWith("/")) return `https://www.yapin.gg${path}`
  if (path.startsWith("https://")) return path
  return `https://files.yapper.website/avatars/${path}`
}

function readMember(value: unknown): BotMember | null {
  if (!value || typeof value !== "object") return null
  const member = value as Record<string, unknown>
  if (typeof member.id !== "string" || typeof member.username !== "string") return null

  return {
    id: member.id,
    username: member.username,
    displayName: typeof member.display_name === "string" ? member.display_name : null,
    nickname: typeof member.nickname === "string" ? member.nickname : null,
    avatarUrl: profileImageUrl(member.avatar_path),
  }
}

function readBan(value: unknown): BotBan | null {
  if (!value || typeof value !== "object") return null
  const ban = value as Record<string, unknown>
  const user = ban.user && typeof ban.user === "object"
    ? ban.user as Record<string, unknown>
    : null
  if (typeof ban.user_id !== "string") return null

  return {
    userId: ban.user_id,
    username: typeof user?.username === "string" ? user.username : "Unknown user",
    displayName: typeof user?.display_name === "string" ? user.display_name : null,
    avatarUrl: profileImageUrl(user?.avatar_path),
    createdAt: typeof ban.created_at === "string" ? ban.created_at : null,
  }
}

async function botApi(path: string, init?: RequestInit) {
  const token = process.env.YAPPER_BOT_TOKEN
  if (!token) return null

  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bot ${token}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    return null
  }
}

export async function getServerChannelData(serverId: string): Promise<ChannelManagementData> {
  if (!process.env.YAPPER_BOT_TOKEN) {
    return { channels: [], categories: [], error: "missing-token" }
  }

  const response = await botApi(`/servers/${encodeURIComponent(serverId)}/channels`)
  if (!response?.ok) return { channels: [], categories: [], error: "unavailable" }

  try {
    const data: unknown = await response.json()
    if (!data || typeof data !== "object") {
      return { channels: [], categories: [], error: "unavailable" }
    }

    const rawChannels = "channels" in data ? data.channels : []
    const rawCategories = "categories" in data ? data.categories : []
    if (!Array.isArray(rawChannels) || !Array.isArray(rawCategories)) {
      return { channels: [], categories: [], error: "unavailable" }
    }

    const channels = rawChannels.flatMap((value): BotChannel[] => {
      if (!value || typeof value !== "object") return []
      const channel = value as Record<string, unknown>
      const kind = channel.kind ?? channel.type
      if (
        typeof channel.id !== "string" ||
        typeof channel.name !== "string" ||
        (kind !== "text" && kind !== "voice")
      ) {
        return []
      }

      return [{
        id: channel.id,
        name: channel.name,
        kind,
        categoryId: typeof channel.category_id === "string" ? channel.category_id : null,
      }]
    })

    const categories = rawCategories.flatMap((value): BotCategory[] => {
      if (!value || typeof value !== "object") return []
      const category = value as Record<string, unknown>
      if (typeof category.id !== "string" || typeof category.name !== "string") return []
      return [{ id: category.id, name: category.name }]
    })

    return { channels, categories, error: null }
  } catch {
    return { channels: [], categories: [], error: "unavailable" }
  }
}

export async function manageBotServerChannel(
  serverId: string,
  targetId: string,
  action: ChannelManagementAction,
  name?: string,
) {
  const isChannel = action.endsWith("channel")
  const renaming = action.startsWith("rename")
  const path = isChannel
    ? `/channels/${encodeURIComponent(targetId)}`
    : `/servers/${encodeURIComponent(serverId)}/categories/${encodeURIComponent(targetId)}`
  const response = await botApi(path, {
    method: renaming ? "PATCH" : "DELETE",
    ...(renaming
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }
      : {}),
  })

  return response?.ok ?? false
}

export async function getOwnedBotServer(serverId: string, userId: string) {
  const response = await botApi(`/servers/${encodeURIComponent(serverId)}`)
  if (!response?.ok) return null

  try {
    const data: unknown = await response.json()
    if (!data || typeof data !== "object" || !("server" in data)) return null
    const value = data.server
    if (!value || typeof value !== "object") return null
    const server = value as Record<string, unknown>

    if (
      server.id !== serverId ||
      server.owner_id !== userId ||
      typeof server.name !== "string"
    ) {
      return null
    }

    return {
      id: serverId,
      name: server.name,
      ownerId: userId,
      iconUrl: serverIconUrl(server.icon_path),
    } satisfies BotServer
  } catch {
    return null
  }
}

export async function getServerModerationData(serverId: string): Promise<ModerationData> {
  if (!process.env.YAPPER_BOT_TOKEN) {
    return {
      members: [],
      bans: [],
      membersError: "missing-token",
      bansError: "missing-token",
    }
  }

  const [membersResponse, bansResponse] = await Promise.all([
    botApi(`/servers/${encodeURIComponent(serverId)}/members?limit=500`),
    botApi(`/servers/${encodeURIComponent(serverId)}/bans`),
  ])

  let members: BotMember[] = []
  let bans: BotBan[] = []
  let membersError: ModerationData["membersError"] = null
  let bansError: ModerationData["bansError"] = null

  if (membersResponse?.ok) {
    try {
      const data: unknown = await membersResponse.json()
      const values = data && typeof data === "object" && "members" in data
        ? data.members
        : []
      if (Array.isArray(values)) {
        members = values.flatMap((value) => {
          const member = readMember(value)
          return member ? [member] : []
        })
      } else {
        membersError = "unavailable"
      }
    } catch {
      membersError = "unavailable"
    }
  } else {
    membersError = "unavailable"
  }

  if (bansResponse?.ok) {
    try {
      const data: unknown = await bansResponse.json()
      const values = data && typeof data === "object" && "bans" in data
        ? data.bans
        : []
      if (Array.isArray(values)) {
        bans = values.flatMap((value) => {
          const ban = readBan(value)
          return ban ? [ban] : []
        })
      } else {
        bansError = "unavailable"
      }
    } catch {
      bansError = "unavailable"
    }
  } else {
    bansError = "unavailable"
  }

  return { members, bans, membersError, bansError }
}

export async function moderateBotServer(
  serverId: string,
  action: "kick" | "ban" | "unban",
  userId: string,
) {
  const path = action === "kick"
    ? `/servers/${encodeURIComponent(serverId)}/kick`
    : action === "ban"
      ? `/servers/${encodeURIComponent(serverId)}/bans`
      : `/servers/${encodeURIComponent(serverId)}/bans/${encodeURIComponent(userId)}`
  const method = action === "unban" ? "DELETE" : "POST"
  const response = await botApi(path, {
    method,
    ...(action === "unban"
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        }),
  })

  return response?.ok ?? false
}

export async function getBotServers(): Promise<ServerListResult> {
  const token = process.env.YAPPER_BOT_TOKEN
  if (!token) return { servers: [], error: "missing-token" }

  try {
    const response = await fetch(`${API_BASE}/servers`, {
      headers: { Authorization: `Bot ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      return {
        servers: [],
        error: response.status === 401 ? "invalid-token" : "unavailable",
      }
    }

    const result: unknown = await response.json()
    const values = Array.isArray(result)
      ? result
      : result && typeof result === "object" && "servers" in result
        ? result.servers
        : []

    if (!Array.isArray(values)) return { servers: [], error: "unavailable" }

    const servers = values.flatMap((value): BotServer[] => {
      if (!value || typeof value !== "object") return []
      const server = value as Record<string, unknown>
      if (typeof server.id !== "string" || typeof server.name !== "string") {
        return []
      }

      return [
        {
          id: server.id,
          name: server.name,
          iconUrl: serverIconUrl(server.icon_path ?? server.icon_url),
          ownerId: typeof server.owner_id === "string" ? server.owner_id : null,
        },
      ]
    })

    return { servers, error: null }
  } catch {
    return { servers: [], error: "unavailable" }
  }
}