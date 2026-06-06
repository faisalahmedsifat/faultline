import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
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
      <main className="flex-1 min-w-0 relative">
        <MobileNav projects={projects} />
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
