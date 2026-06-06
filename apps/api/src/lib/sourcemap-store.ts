import { mkdir, readFile, writeFile, rm, readdir } from "node:fs/promises"
import { join } from "node:path"

export interface SourceMapStore {
  save(projectId: string, release: string, filename: string, content: Buffer): Promise<void>
  get(projectId: string, release: string, filename: string): Promise<Buffer | null>
  list(projectId: string, release: string): Promise<string[]>
  deleteRelease(projectId: string, release: string): Promise<void>
  deleteProject(projectId: string): Promise<void>
}

export class FilesystemSourceMapStore implements SourceMapStore {
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? process.env.SOURCEMAPS_DIR ?? "./data/sourcemaps"
  }

  private dir(projectId: string, release: string): string {
    return join(this.baseDir, projectId, release)
  }

  private path(projectId: string, release: string, filename: string): string {
    return join(this.dir(projectId, release), filename)
  }

  async save(projectId: string, release: string, filename: string, content: Buffer): Promise<void> {
    const dir = this.dir(projectId, release)
    await mkdir(dir, { recursive: true })
    await writeFile(this.path(projectId, release, filename), content)
  }

  async get(projectId: string, release: string, filename: string): Promise<Buffer | null> {
    try {
      return await readFile(this.path(projectId, release, filename))
    } catch {
      return null
    }
  }

  async list(projectId: string, release: string): Promise<string[]> {
    try {
      return await readdir(this.dir(projectId, release))
    } catch {
      return []
    }
  }

  async deleteRelease(projectId: string, release: string): Promise<void> {
    await rm(this.dir(projectId, release), { recursive: true, force: true })
  }

  async deleteProject(projectId: string): Promise<void> {
    await rm(join(this.baseDir, projectId), { recursive: true, force: true })
  }
}

let defaultStore: SourceMapStore | null = null

export function getSourceMapStore(): SourceMapStore {
  if (!defaultStore) {
    defaultStore = new FilesystemSourceMapStore()
  }
  return defaultStore
}
