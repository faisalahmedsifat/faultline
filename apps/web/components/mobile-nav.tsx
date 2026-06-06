"use client"

import { useState } from "react"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { SidebarNav } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, Activity, ExternalLink } from "lucide-react"

export function MobileNav({
  projects
}: {
  projects: Array<{ id: string; name: string }>
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Activity className="size-3 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              fault<span className="text-primary">line</span>
            </span>
          </Link>
        </div>
        <ThemeToggle className="size-8" />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 gap-0">
          <SheetHeader className="px-4 pt-5 pb-4 border-b border-border">
            <SheetTitle>
              <Link
                href="/"
                className="flex items-center gap-2.5"
                onClick={() => setOpen(false)}
              >
                <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="size-3.5 text-primary" />
                </div>
                <span className="font-semibold text-sm tracking-tight">
                  fault<span className="text-primary">line</span>
                </span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          <SidebarNav projects={projects} onNavigate={() => setOpen(false)} />
          <div className="px-4 pb-4 border-t border-border pt-3">
            <a
              href="https://github.com/faisalahmedsifat/faultline"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              GitHub
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
