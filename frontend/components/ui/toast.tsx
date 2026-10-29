"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { CheckCircle2, CircleAlert, X } from "lucide-react"

import { cn } from "@/lib/utils"

const toast = ToastPrimitive.createToastManager()

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((item) => {
    const Icon = item.type === "success" ? CheckCircle2 : CircleAlert

    return (
      <ToastPrimitive.Root
        className={cn(
          "pointer-events-auto w-full rounded-lg border bg-popover text-popover-foreground shadow-lg outline-none transition-all data-[type=error]:border-destructive data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0",
        )}
        key={item.id}
        toast={item}
      >
        <ToastPrimitive.Content className="flex items-start gap-3 p-4">
          <Icon
            aria-hidden="true"
            className={item.type === "success" ? "mt-0.5 size-4 text-primary" : "mt-0.5 size-4 text-destructive"}
          />
          <div className="grid min-w-0 flex-1 gap-1">
            <ToastPrimitive.Title className="text-sm font-medium">{item.title}</ToastPrimitive.Title>
            <ToastPrimitive.Description className="text-sm text-muted-foreground">
              {item.description}
            </ToastPrimitive.Description>
          </div>
          <ToastPrimitive.Close
            aria-label="Dismiss notification"
            className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X aria-hidden="true" size={15} />
          </ToastPrimitive.Close>
        </ToastPrimitive.Content>
      </ToastPrimitive.Root>
    )
  })
}

function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={toast}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto flex w-auto max-w-sm flex-col gap-2 outline-none sm:right-6 sm:left-auto sm:mx-0 sm:w-full">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}

export { Toaster, toast }