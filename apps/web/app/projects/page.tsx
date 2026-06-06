import { getProjects } from "@/lib/api"
import { CreateProjectForm } from "@/components/create-project-form"
import { ProjectCard } from "@/components/project-card"

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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>

      <div className="card mb-6">
        <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
          Create New Project
        </h2>
        <CreateProjectForm />
      </div>

      {error && <div className="toast toast-error mb-4">{error}</div>}

      {projects.length === 0 && !error ? (
        <div className="text-center py-16 text-white/60">
          <h3 className="text-lg font-medium text-white/80 mb-2">No projects yet</h3>
          <p className="text-sm">Create your first project above to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  )
}
