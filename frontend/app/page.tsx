import { cookies } from "next/headers"
import { ArrowRight, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PortalHeader } from "@/components/portal-header"
import { SupportDialog } from "@/components/support-dialog"
import { isOAuthConfigured, readSession, SESSION_COOKIE } from "@/lib/yapin-auth"

const loginErrors: Record<string, string> = {
  setup: "Sign-in is not configured yet.",
  cancelled: "Sign-in was cancelled. You can try again.",
  login: "Yapin’ sign-in didn’t complete. Please try again.",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const query = await searchParams
  const cookieStore = await cookies()
  const user = readSession(cookieStore.get(SESSION_COOKIE)?.value)
  const error = query.error ? loginErrors[query.error] : undefined

  return (
    <main className="portal-shell">
      <PortalHeader user={user} />
      <section className="home-landing">
        <div className="home-copy">
          {error ? <p className="error-message" role="alert">{error}</p> : null}
          <h1>No sides.<br /><span>Just solutions.</span></h1>
          <p className="home-description">
            Your All in one bot for Yapin'. Discover what&apos;s next for your community today.
          </p>   
          <div className="home-actions">
            {user ? (
              <Button variant="secondary" size="lg" nativeButton={false} render={<a href="/dashboard" />}>
                <span data-icon="inline-start"><ArrowRight aria-hidden="true" /></span>
                Go to dashboard
              </Button>
            ) : isOAuthConfigured() ? (
              <Button className="home-cta" nativeButton={false} render={<a href="/api/auth/login" />}>
                <span data-icon="inline-start"><LogIn aria-hidden="true" /></span>
                Login with Yapin&apos;
              </Button>
            ) : (
              <p className="setup-hint">Configure OAuth in <code>.env.local</code> to enable sign-in.</p>
            )}
            <SupportDialog />
          </div>
        </div>
      </section>
    </main>
  )
}
