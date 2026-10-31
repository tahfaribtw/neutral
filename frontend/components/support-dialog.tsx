"use client"

import { useState } from "react"
import { Gift } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const kofiUrl = "https://ko-fi.com/tahfarithedev"

export function SupportDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ size: "lg", variant: "secondary" })}>
        <Gift aria-hidden="true" />
        Support me
      </DialogTrigger>
      <DialogContent className="support-dialog-content">
        <DialogHeader>
          <DialogTitle>Support Neutral</DialogTitle>
          <DialogDescription>
            If Neutral is useful to you, you can support me on{" "}
            <a href={kofiUrl} rel="noreferrer" target="_blank">Ko-fi</a>.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <iframe
            className="support-kofi-frame"
            height={712}
            loading="lazy"
            src={`${kofiUrl}/?hidefeed=true&widget=true&embed=true&preview=true`}
            title="Support tahfarithedev on Ko-fi"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}