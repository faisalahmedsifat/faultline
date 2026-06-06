"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Activity, FolderOpen, Settings, ExternalLink } from "lucide-react"

function projectColor(projectId: string): string {
  let hash = 0
  for (let i = 0; i < projectId.length; i++) {
    hash = projectId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 55% 55%)`
}

export function SidebarNav({
  projects,
  onNavigate
}: {
  projects: Array<{ id: string; name: string }>
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const activeProjectId = pathname.match(/\/projects\/([^/]+)/)?.[1]

  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.12em]">
            Projects
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          {projects.length === 0 && (
            <p className="text-xs text-muted-foreground/60 px-2 py-3 text-center">
              No projects yet
            </p>
          )}
          {projects.map((p) => {
            const isActive = activeProjectId === p.id
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                onClick={onNavigate}
                className={cn(
                  "group relative px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-150 truncate flex items-center gap-2.5",
                  isActive
                    ? "bg-sidebar-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
                )}
                <span
                  className={cn(
                    "size-2 rounded-full shrink-0 transition-transform",
                    isActive && "scale-110"
                  )}
                  style={{ backgroundColor: projectColor(p.id) }}
                />
                <span className="truncate">{p.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.12em] px-2 mb-2">
          Manage
        </p>
        <div className="flex flex-col gap-0.5">
          <Link
            href="/projects"
            onClick={onNavigate}
            className={cn(
              "relative px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-150 flex items-center gap-2.5",
              pathname === "/projects"
                ? "bg-sidebar-accent text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
            )}
          >
            {pathname === "/projects" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
            )}
            <FolderOpen className="size-3.5" />
            All Projects
          </Link>
          {activeProjectId && (
            <Link
              href={`/projects/${activeProjectId}/settings`}
              onClick={onNavigate}
              className={cn(
                "relative px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-150 flex items-center gap-2.5",
                pathname.endsWith("/settings")
                  ? "bg-sidebar-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
              )}
            >
              {pathname.endsWith("/settings") && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
              )}
              <Settings className="size-3.5" />
              Settings
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export function Sidebar({
  projects
}: {
  projects: Array<{ id: string; name: string }>
}) {
  return (
    <aside className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-screen sticky top-0 max-md:hidden">
      <div className="px-4 pt-5 pb-4 flex items-center gap-2.5">
        <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="size-3.5 text-primary" />
        </div>
        <Link href="/" className="font-semibold text-sm tracking-tight">
          fault<span className="text-primary">line</span>
        </Link>
      </div>

      <SidebarNav projects={projects} />

      <div className="px-3 pb-3 pt-2 border-t border-sidebar-border mt-auto">
        <div className="flex items-center justify-between px-1">
          <a
            href="https://github.com/faisalahmedsifat/faultline"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            GitHub
            <ExternalLink className="size-2.5" />
          </a>
          <ThemeToggle className="size-7" />
        </div>
      </div>
    </aside>
  )
}
