"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      aria-label="Refresh dashboard data"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      size="sm"
      type="button"
      variant="outline"
    >
      <RefreshCw aria-hidden="true" className={isPending ? "animate-spin" : undefined} />
      Refresh
    </Button>
  )
}