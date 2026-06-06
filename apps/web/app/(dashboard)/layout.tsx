import { Sidebar } from "@/components/sidebar"
import { getProjects } from "@/lib/api"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let projects: Array<{ id: string; name: string }> = []

  try {
    const data = await getProjects()
    projects = data.projects
  } catch {
    // Sidebar renders empty if API is down
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects} />
      <main className="flex-1 min-w-0">
        <div className="md:hidden px-4 pt-4 pb-2 border-b border-border">
          <a href="/" className="font-bold text-sm tracking-tight">
            fault<span className="text-primary">line</span>
          </a>
        </div>
        {children}
      </main>
    </div>
  )
}
