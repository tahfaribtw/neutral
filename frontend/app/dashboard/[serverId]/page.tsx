import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { PortalHeader } from "@/components/portal-header"
import { ServerWorkspace } from "@/components/server-workspace"
import { readSession, SESSION_COOKIE } from "@/lib/yapin-auth"
import {
  getOwnedBotServer,
  getServerChannelData,
  getServerModerationData,
} from "@/lib/yapin-servers"
import { getWelcomeSettings, welcomeWebhookConfigured } from "@/lib/welcome-settings"

export default async function ServerPage({
  params,
}: {
  params: Promise<{ serverId: string }>
}) {
  const [{ serverId }, cookieStore] = await Promise.all([params, cookies()])
  const user = readSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!user) redirect("/")

  const server = await getOwnedBotServer(serverId, user.id)
  if (!server) notFound()

  const [moderation, channelData, welcome] = await Promise.all([
    getServerModerationData(server.id),
    getServerChannelData(server.id),
    getWelcomeSettings(server.id, user.id),
  ])
  const publicUrl = process.env.YAPPER_PUBLIC_URL?.replace(/\/+$/, "")
  const welcomeWebhookUrl = publicUrl ? `${publicUrl}/api/yapin/events` : null

  return (
    <main className="portal-shell">
      <PortalHeader user={user} />
      <ServerWorkspace
        server={server}
        moderation={moderation}
        channelData={channelData}
        welcome={welcome}
        welcomeWebhookUrl={welcomeWebhookUrl}
        webhookConfigured={welcomeWebhookConfigured()}
      />
    </main>
  )
}