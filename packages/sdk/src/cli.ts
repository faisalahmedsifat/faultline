#!/usr/bin/env bun

/**
 * faultline CLI — upload source maps
 *
 * Usage:
 *   faultline upload-sourcemaps --dir .next/static --release v2.3.1
 *   faultline upload-sourcemaps --dir dist --release $npm_package_version
 *
 * Env vars:
 *   FAULTLINE_DSN         — project DSN key
 *   FAULTLINE_BASE_URL    — faultline server URL
 */

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === "help") {
    console.log(`faultline CLI

Usage:
  faultline upload-sourcemaps --dir <path> --release <version>

Commands:
  upload-sourcemaps   Upload .map files to faultline for source map resolution
  help                Show this help

Options:
  --dir <path>        Directory containing .map files
  --release <version> Release version (e.g. "v2.3.1")

Env:
  FAULTLINE_DSN        Project DSN key (required)
  FAULTLINE_BASE_URL   faultline server URL (default: https://faultline.dev)
`)
    return
  }

  if (command === "upload-sourcemaps") {
    await uploadSourcemaps(args.slice(1))
  } else {
    console.error(`Unknown command: ${command}`)
    process.exit(1)
  }
}

async function uploadSourcemaps(args: string[]) {
  const dirIdx = args.indexOf("--dir")
  const releaseIdx = args.indexOf("--release")

  if (dirIdx === -1 || releaseIdx === -1) {
    console.error("Usage: faultline upload-sourcemaps --dir <path> --release <version>")
    process.exit(1)
  }

  const dir = args[dirIdx + 1]
  const release = args[releaseIdx + 1]

  if (!dir || !release) {
    console.error("--dir and --release are required")
    process.exit(1)
  }

  const dsn = process.env.FAULTLINE_DSN
  const baseUrl = process.env.FAULTLINE_BASE_URL ?? "https://faultline.dev"

  if (!dsn) {
    console.error("FAULTLINE_DSN is not set")
    process.exit(1)
  }

  // Find .map files
  const { readdir, readFile } = await import("node:fs/promises")
  const { join, extname } = await import("node:path")

  let files: string[]
  try {
    files = (await readdir(dir, { recursive: true }))
      .filter((f) => extname(f) === ".map")
  } catch (err) {
    console.error(`Cannot read directory: ${dir}`)
    process.exit(1)
  }

  if (files.length === 0) {
    console.log("No .map files found in", dir)
    return
  }

  console.log(`Uploading ${files.length} source maps to faultline...`)

  const formData = new FormData()
  formData.append("release", release)

  for (const file of files) {
    const content = await readFile(join(dir, file))
    formData.append("files", new Blob([content]), file)
  }

  const projectId = dsn // DSN key is the project identifier
  const url = `${baseUrl}/api/projects/${projectId}/sourcemaps`

  try {
    const res = await fetch(url, { method: "POST", body: formData })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      console.error(`Upload failed: ${body?.error?.message ?? res.statusText}`)
      process.exit(1)
    }

    const data = await res.json() as { uploaded: number; release: string }
    console.log(`Uploaded ${data.uploaded} source maps for release ${data.release}`)
  } catch (err) {
    console.error("Upload failed:", err instanceof Error ? err.message : "Network error")
    process.exit(1)
  }
}

main()
