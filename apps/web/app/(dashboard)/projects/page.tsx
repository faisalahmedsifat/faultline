import { getProjects } from "@/lib/api"
import { CreateProjectForm } from "@/components/create-project-form"
import { ProjectCard } from "@/components/project-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-12">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Projects</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Create New Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateProjectForm />
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {projects.length === 0 && !error ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-2">No projects yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first project above to get started.
          </p>
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
