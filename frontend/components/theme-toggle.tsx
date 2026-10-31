"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        aria-label="Toggle color theme"
        className="theme-toggle"
        size="icon"
        type="button"
        variant="secondary"
      >
        <Sun aria-hidden="true" />
      </Button>
    )
  }

  const isLight = resolvedTheme === "light"
  return (
    <Button
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="theme-toggle"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      size="icon-lg"
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      type="button"
      variant="ghost"
    >
      {isLight ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </Button>
  )
}