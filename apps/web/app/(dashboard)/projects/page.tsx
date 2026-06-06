import { getProjects } from "@/lib/api"
import { CreateProjectForm } from "@/components/create-project-form"
import { ProjectCard } from "@/components/project-card"
import { FolderOpen, Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  let projects = [] as Awaited<ReturnType<typeof getProjects>>["projects"]
  let error: string | null = null

  try {
    const data = await getProjects()
    projects = data.projects
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load projects"
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your error tracking projects
          </p>
        </div>
      </div>

      <div className="relative rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-5 mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="size-3.5 text-primary" />
          </div>
          <p className="text-sm font-medium">Create New Project</p>
        </div>
        <CreateProjectForm />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-4 mb-6 flex items-start gap-3">
          <span className="size-2 rounded-full bg-destructive mt-1.5 shrink-0" />
          {error}
        </div>
      )}

      {projects.length === 0 && !error ? (
        <div className="text-center py-20 border border-border rounded-xl bg-card/50">
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="size-6 text-muted-foreground" />
          </div>
          <p className="text-base font-medium mb-1.5">No projects yet</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Create your first project above to start tracking errors in your application.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((p, i) => (
            <div
              key={p.id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <ProjectCard project={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
