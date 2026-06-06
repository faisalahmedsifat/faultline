"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function Sidebar({
  projects
}: {
  projects: Array<{ id: string; name: string }>
}) {
  const pathname = usePathname()
  const activeProjectId = pathname.match(/\/projects\/([^/]+)/)?.[1]

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0 max-md:hidden">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-sm tracking-tight">
          fault<span className="text-primary">line</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
              Projects
            </p>
            <Link href="/projects" className="text-muted-foreground hover:text-foreground">
              <Plus className="size-3.5" />
            </Link>
          </div>
          <div className="flex flex-col gap-0.5">
            {projects.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">
                No projects yet
              </p>
            )}
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className={cn(
                  "px-2 py-1.5 rounded-md text-sm transition-colors truncate",
                  activeProjectId === p.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                )}
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest px-2 mb-1">
            Manage
          </p>
          <div className="flex flex-col gap-0.5">
            <Link
              href="/projects"
              className={cn(
                "px-2 py-1.5 rounded-md text-sm transition-colors",
                pathname === "/projects"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              )}
            >
              All Projects
            </Link>
            {activeProjectId && (
              <Link
                href={`/projects/${activeProjectId}/settings`}
                className={cn(
                  "px-2 py-1.5 rounded-md text-sm transition-colors",
                  pathname.endsWith("/settings")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                )}
              >
                Settings
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="px-4 pb-4">
        <p className="text-[11px] text-muted-foreground/50">
          Self-hosted error tracking
        </p>
      </div>
    </aside>
  )
}
