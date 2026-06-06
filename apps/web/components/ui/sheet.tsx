"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon, GripVertical } from "lucide-react"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 backdrop-blur-md transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function ResizeHandle({
  onResize,
  side,
}: {
  onResize: (deltaX: number) => void
  side: "left" | "right"
}) {
  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const doc = e.currentTarget.ownerDocument

      function onPointerMove(ev: PointerEvent) {
        const delta = ev.clientX - startX
        onResize(side === "right" ? -delta : delta)
      }

      function onPointerUp() {
        doc.removeEventListener("pointermove", onPointerMove)
        doc.removeEventListener("pointerup", onPointerUp)
        doc.body.style.cursor = ""
        doc.body.style.userSelect = ""
      }

      doc.body.style.cursor = "col-resize"
      doc.body.style.userSelect = "none"
      doc.addEventListener("pointermove", onPointerMove)
      doc.addEventListener("pointerup", onPointerUp)
    },
    [onResize, side]
  )

  return (
    <div
      onPointerDown={handlePointerDown}
      className={cn(
        "absolute top-0 bottom-0 z-10 w-1.5 cursor-col-resize group/handle flex items-center justify-center",
        "hover:bg-primary/10 active:bg-primary/20 transition-colors",
        side === "right" ? "left-0" : "right-0"
      )}
      aria-label="Resize panel"
      role="separator"
      aria-orientation="vertical"
    >
      <div className="opacity-0 group-hover/handle:opacity-60 transition-opacity">
        <GripVertical className="size-3 text-muted-foreground" />
      </div>
    </div>
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  resizable = false,
  defaultWidth,
  minWidth = 360,
  maxWidth = 960,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  resizable?: boolean
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
}) {
  const [width, setWidth] = React.useState<number | null>(null)
  const widthRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!resizable || side !== "right") return
    const stored = localStorage.getItem("sheet-width")
    const initial = stored ? Number(stored) : (defaultWidth ?? 576)
    const clamped = Math.min(Math.max(initial, minWidth), maxWidth)
    setWidth(clamped)
    widthRef.current = clamped
  }, [resizable, side, defaultWidth, minWidth, maxWidth])

  const handleResize = React.useCallback(
    (deltaX: number) => {
      const current = widthRef.current
      if (current == null) return
      const next = Math.min(Math.max(current + deltaX, minWidth), maxWidth)
      widthRef.current = next
      setWidth(next)
      localStorage.setItem("sheet-width", String(next))
    },
    [minWidth, maxWidth]
  )

  const isHorizontal = side === "left" || side === "right"
  const useResize = resizable && isHorizontal

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-surface text-sm text-foreground shadow-[rgba(0,0,0,0.08)_-4px_0_24px,rgba(0,0,0,0.04)_-2px_0_8px] ring-1 ring-border/80 transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm dark:shadow-[rgba(0,0,0,0.3)_-4px_0_24px,rgba(0,0,0,0.2)_-2px_0_8px]",
          className
        )}
        style={useResize && width ? { width, maxWidth: "none" } : undefined}
        {...props}
      >
        {useResize && <ResizeHandle onResize={handleResize} side={side} />}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
