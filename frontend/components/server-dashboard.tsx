import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Server, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RefreshButton } from "@/components/refresh-button"
import type { ServerListResult } from "@/lib/yapin-servers"

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function ServerIcon({ name, src }: { name: string; src: string | null }) {
  if (src) {
    return (
      <Image
        alt=""
        className="server-avatar-image"
        height={56}
        src={src}
        unoptimized
        width={56}
      />
    )
  }

  return <span className="server-avatar-fallback">{initials(name)}</span>
}

export function ServerDashboard({ result }: { result: ServerListResult }) {
  return (
    <section className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow"><span className="status-dot" /> BOT CONNECTION</div>
          <h1>Neutral&apos;s servers</h1>
          <p>Servers where this bot has been added.</p>
        </div>
        <div className="dashboard-heading-actions">
          <RefreshButton />
          <div className="server-count">
            <strong>{result.servers.length.toString().padStart(2, "0")}</strong>
            <span>SERVER{result.servers.length === 1 ? "" : "S"}</span>
          </div>
        </div>
      </div>

      {result.error ? (
        <div className="notice-panel" role="status">
          <ShieldCheck aria-hidden="true" size={19} />
          <div>
            <strong>
              {result.error === "missing-token"
                ? "Bot token not configured"
                : result.error === "invalid-token"
                  ? "Bot token was rejected"
                  : "Could not load servers"}
            </strong>
            <p>
              {result.error === "missing-token"
                ? "Set YAPPER_BOT_TOKEN on the server to load the bot’s memberships."
                : result.error === "invalid-token"
                  ? "Check that YAPPER_BOT_TOKEN is current, then reload this page."
                  : "The Yapin’ bot API is unavailable right now. Reload to try again."}
            </p>
          </div>
        </div>
      ) : result.servers.length ? (
        <div className="server-list">
          {result.servers.map((server, index) => (
            <Link
              className="server-row"
              href={`/dashboard/${server.id}`}
              key={server.id}
              style={{ "--row-index": index } as React.CSSProperties}
              aria-label={`Manage ${server.name}`}
            >
              <div className="server-avatar">
                <ServerIcon name={server.name} src={server.iconUrl} />
              </div>
              <div className="server-details">
                <h2>{server.name}</h2>
              </div>
              <span className="server-member-mark">
                <Server aria-hidden="true" size={16} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon"><Server aria-hidden="true" size={24} /></span>
          <h2>No owned servers found</h2>
          <p>Add Neutral to a server you own to manage its members here.</p>
          <Button nativeButton={false} render={<a href="https://www.yapin.gg/developers" rel="noreferrer" target="_blank" />}>
            Add bot to a server <ArrowUpRight aria-hidden="true" />
          </Button>
        </div>
      )}
      <p className="privacy-note">
        <ShieldCheck aria-hidden="true" size={15} /> Your Yapin’ account is used only to sign in.
      </p>
    </section>
  )
}