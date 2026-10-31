import Image from "next/image"
import { ChevronDown, LayoutDashboard, LogIn, LogOut } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import type { YapperUser } from "@/lib/yapin-auth"

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function PortalHeader({ user }: { user: YapperUser | null }) {
  const displayName = user?.displayName || user?.username

  return (
    <header className="portal-header">
      <a aria-label="Neutral home" className="wordmark" href="/">
        neutral.
      </a>
      <div className="portal-header-actions">
        <ThemeToggle />
        {user && displayName ? (
          <details className="account-menu">
          <summary className="account-menu-trigger">
            {user.avatarUrl ? (
              <Image
                alt=""
                className="account-avatar"
                height={34}
                loading="eager"
                src={user.avatarUrl}
                unoptimized
                width={34}
              />
            ) : (
              <span className="account-avatar account-avatar-fallback">
                {initials(displayName)}
              </span>
            )}
            <span className="account-name">{displayName}</span>
            <ChevronDown aria-hidden="true" className="account-chevron" size={15} />
          </summary>
          <div className="account-dropdown">
            <a href="/dashboard">
              <LayoutDashboard aria-hidden="true" size={16} />
              Dashboard
            </a>
            <form action="/api/auth/logout" method="post">
              <button type="submit">
                <LogOut aria-hidden="true" size={16} />
                Log out
              </button>
            </form>
          </div>
          </details>
        ) : (
          <a className="header-login" href="/api/auth/login">
            <LogIn aria-hidden="true" size={16} />
            Login
          </a>
        )}
      </div>
    </header>
  )
}