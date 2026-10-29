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

  const [moderation, channelData] = await Promise.all([
    getServerModerationData(server.id),
    getServerChannelData(server.id),
  ])
  return (
    <main className="portal-shell">
      <PortalHeader user={user} />
      <ServerWorkspace server={server} moderation={moderation} channelData={channelData} />
    </main>
  )
}