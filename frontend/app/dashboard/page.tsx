import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { PortalHeader } from "@/components/portal-header"
import { ServerDashboard } from "@/components/server-dashboard"
import { readSession, SESSION_COOKIE } from "@/lib/yapin-auth"
import { getBotServers } from "@/lib/yapin-servers"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const user = readSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!user) redirect("/")

  const result = await getBotServers()

  return (
    <main className="portal-shell">
      <PortalHeader user={user} />
      <ServerDashboard result={result} />
    </main>
  )
}