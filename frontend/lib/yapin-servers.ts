export type BotServer = {
  id: string
  name: string
  iconUrl: string | null
}

export type ServerListResult = {
  servers: BotServer[]
  error: "missing-token" | "invalid-token" | "unavailable" | null
}

function serverIconUrl(path: unknown) {
  if (typeof path !== "string" || !path) return null
  if (path.startsWith("/")) return `https://www.yapin.gg${path}`
  if (path.startsWith("https://")) return path
  return `https://files.yapper.website/icons/${path}`
}

export async function getBotServers(): Promise<ServerListResult> {
  const token = process.env.YAPPER_BOT_TOKEN
  if (!token) return { servers: [], error: "missing-token" }

  try {
    const response = await fetch("https://bots.yapper.website/api/bot/v1/servers", {
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
        },
      ]
    })

    return { servers, error: null }
  } catch {
    return { servers: [], error: "unavailable" }
  }
}