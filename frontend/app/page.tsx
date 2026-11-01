import { cookies } from "next/headers"
import {
  BarChart3,
  ChevronDown,
  LogIn,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { PortalHeader } from "@/components/portal-header"
import { isOAuthConfigured, readSession, SESSION_COOKIE } from "@/lib/yapin-auth"

const loginErrors: Record<string, string> = {
  setup: "Sign-in is not configured yet.",
  cancelled: "Sign-in was cancelled. You can try again.",
  login: "Yapin’ sign-in didn’t complete. Please try again.",
}

// Replace with your bot's real invite link
const INVITE_URL =
  process.env.NEXT_PUBLIC_BOT_INVITE_URL ?? "https://yapin.gg/invite/b9gCNraQ5U"

// Edit these to match what your bot actually does
const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Shield,
    title: "Moderation",
    description: "Keep your community safe with simple, powerful moderation tools.",
  },
  {
    icon: BarChart3,
    title: "Activity & stats",
    description: "See what's happening in your community with clear insights.",
  },
  {
    icon: Zap,
    title: "Fast & reliable",
    description: "Quick responses and solid uptime, so it's there when you need it.",
  },
  {
    icon: Sparkles,
    title: "Easy dashboard",
    description: "Manage every server from one place, no commands required.",
  },
]

const steps = [
  {
    title: "Add the bot",
    description: "Invite Yapper to your server in a couple of clicks.",
  },
  {
    title: "Log in",
    description: "Sign in with Yapin' to see all the servers you manage.",
  },
  {
    title: "Set it up",
    description: "Pick your server in the dashboard and configure everything.",
  },
]

const faqs = [
  {
    question: "Is Yapper free?",
    answer: "Yes, you can add Yapper to your server and start using it for free.",
  },
  {
    question: "What permissions does it need?",
    answer:
      "Only what it needs to run its features. You'll see the full list before you add it.",
  },
  {
    question: "How do I manage my servers?",
    answer: "Log in, then open the dashboard and choose the server you want to configure.",
  },
  {
  question: "Something's broken. Where do I get help?",
  answer: (
    <>
      Join the{" "}
      <a
        href='https://yapin.gg/invite/b9gCNraQ5U'
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline underline-offset-4"
      >
        support server
      </a>{" "}
      and we'll help you out.
    </>
  ),
},
]

const sectionClass =
  "w-full max-w-5xl self-center justify-self-center mx-auto px-6 py-16 text-center md:px-12"

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

      {/* Hero */}
      <section className="home-landing">
        <div className="home-copy text-left">
          {error ? <p className="error-message" role="alert">{error}</p> : null}
          <h1>No sides.<br /><span>Just solutions.</span></h1>
          <p className="home-description">
            Your All in one bot for Yapin'. Discover what&apos;s next for your community today.
          </p>
          <div className="home-actions flex flex-row flex-wrap items-center justify-start gap-3">
            <Button size="lg" nativeButton={false} render={<a href={INVITE_URL} />}>
              <span data-icon="inline-start"><Plus aria-hidden="true" /></span>
              Add to Yapper
            </Button>

            {user ? (
              <Button size="lg" variant="outline" nativeButton={false} render={<a href="/dashboard" />}>
                <span data-icon="inline-start"><Settings aria-hidden="true" /></span>
                Manage servers
              </Button>
            ) : isOAuthConfigured() ? (
              <Button size="lg" variant="outline" nativeButton={false} render={<a href="/api/auth/login" />}>
                <span data-icon="inline-start"><LogIn aria-hidden="true" /></span>
                Login to Yapper
              </Button>
            ) : (
              <p className="setup-hint">Configure OAuth in <code>.env.local</code> to enable sign-in.</p>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={sectionClass}>
        <h2 className="text-3xl font-semibold tracking-tight">Everything in one bot</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Stop juggling a dozen bots. Yapper covers what your community needs.
        </p>
        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon aria-hidden="true" size={20} />
              </div>
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={sectionClass}>
        <h2 className="text-3xl font-semibold tracking-tight">Up and running in minutes</h2>
        <ol className="mt-8 grid gap-4 text-left sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border bg-card p-5">
              <span className="mb-3 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="font-medium">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className={sectionClass}>
        <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 text-left">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-border bg-card px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown
                  aria-hidden="true"
                  size={16}
                  className="shrink-0 transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${sectionClass} pb-24`}>
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to give it a try?</h2>
          <p className="mt-2 text-muted-foreground">
            Add it to your server and see what it can do for your community.
          </p>
          <div className="mt-6 flex justify-center">
            <Button size="lg" nativeButton={false} render={<a href={INVITE_URL} />}>
              <span data-icon="inline-start"><Plus aria-hidden="true" /></span>
              Add to Yapper
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}