import { execSync, spawnSync } from "child_process"
import { promises as fs, readFileSync, readdirSync, type Dirent } from "fs"
import path from "path"
import { IGNORED_FOLDERS, IGNORED_FILES, IGNORED_EXTENSIONS } from "./constants.js"

export function isGitHubRepository(): boolean {
  try {
    const result = spawnSync("git", ["remote", "-v"], { encoding: "utf-8" })
    if (result.error || result.status !== 0) return false
    return result.stdout.includes("github.com")
  } catch {
    return false
  }
}

function isGitRepo(): boolean {
  try {
    const result = spawnSync("git", ["rev-parse", "--git-dir"], {
      encoding: "utf-8",
      stdio: "pipe",
    })
    return result.status === 0
  } catch {
    return false
  }
}

export function getAuditScope(base?: string, head?: string): string {
  try {
    if (!isGitRepo()) {
      return "Not a git repository."
    }
    let args: string[]
    if (base && head) {
      args = ["diff", base, head]
    } else if (isGitHubRepository()) {
      args = ["diff", "--merge-base", "origin/HEAD"]
    } else {
      args = ["diff"]
    }

    const result = spawnSync("git", args, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    })

    if (result.error) return `Error: ${result.error.message}`
    return result.stdout || "No changes detected."
  } catch (error: any) {
    return `Error getting audit scope: ${error.message}`
  }
}

export function getFilesToAudit(): string[] {
  try {
    if (!isGitRepo()) {
      return getFilesToAuditFallback()
    }
    const trackedResult = execSync("git ls-files", { encoding: "utf-8" }).split("\n").filter(Boolean)
    const untrackedResult = execSync("git ls-files --others --exclude-standard", { encoding: "utf-8" }).split("\n").filter(Boolean)

    const allFiles = [...new Set([...trackedResult, ...untrackedResult])]

    return allFiles.filter(file => {
      if (IGNORED_FOLDERS.some(folder => file.includes(folder))) return false
      if (IGNORED_FILES.some(name => file.toLowerCase() === name.toLowerCase())) return false
      if (IGNORED_EXTENSIONS.some(ext => file.toLowerCase().endsWith(ext))) return false
      return true
    })
  } catch {
    return getFilesToAuditFallback()
  }
}

function getFilesToAuditFallback(): string[] {
  try {
    const startDir = process.cwd()
    const found: string[] = []

    function walk(dir: string) {
      let entries: Dirent[]
      try {
        entries = readdirSync(dir, { withFileTypes: true })
      } catch {
        return
      }
      for (const entry of entries) {
        if (IGNORED_FOLDERS.some(folder => entry.name === folder)) continue
        if (entry.name.startsWith(".")) continue
        const fullPath = path.join(dir, entry.name)
        const relativePath = path.relative(startDir, fullPath)
        if (entry.isDirectory()) {
          walk(fullPath)
        } else if (entry.isFile()) {
          if (IGNORED_FILES.some(name => entry.name.toLowerCase() === name.toLowerCase())) continue
          if (IGNORED_EXTENSIONS.some(ext => relativePath.toLowerCase().endsWith(ext))) continue
          found.push(relativePath)
        }
      }
    }

    walk(startDir)
    return found
  } catch {
    return []
  }
}

export function getLineCount(files: string[]): number {
  let totalLines = 0

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8")
      totalLines += content.split("\n").length
    } catch (error: any) {
      console.error(`Error reading file ${file}:`, error.message)
    }
  }

  return totalLines
}

export async function detectProjectLanguage(): Promise<"Node.js" | "Python" | "Go" | "Unknown"> {
  try {
    const startDir = process.cwd()
    let current = startDir

    for (let i = 0; i < 5; i++) {
      const hasPackageJson = await fs.access(path.join(current, "package.json")).then(() => true).catch(() => false)
      if (hasPackageJson) return "Node.js"

      const hasGoMod = await fs.access(path.join(current, "go.mod")).then(() => true).catch(() => false)
      if (hasGoMod) return "Go"

      const hasRequirements = await fs.access(path.join(current, "requirements.txt")).then(() => true).catch(() => false)
      if (hasRequirements) return "Python"

      const hasPyproject = await fs.access(path.join(current, "pyproject.toml")).then(() => true).catch(() => false)
      if (hasPyproject) return "Python"

      const parent = path.dirname(current)
      if (parent === current) break
      current = parent
    }

    return "Unknown"
  } catch {
    return "Unknown"
  }
}
