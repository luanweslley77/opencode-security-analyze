import { promises as fs } from "fs"
import path from "path"

export async function findLineNumbers(
  filePath: string,
  snippet: string,
  cwd: string
): Promise<string> {
  if (!snippet.trim()) {
    return "Snippet is empty."
  }

  try {
    const resolvedPath = path.resolve(cwd, filePath)
    const realPath = await fs.realpath(resolvedPath)
    const normalizedCwd = path.resolve(cwd) + path.sep

    if (!realPath.startsWith(normalizedCwd)) {
      return "File path is outside of the current working directory."
    }

    const content = await fs.readFile(realPath, "utf-8")
    const lines = content.split("\n")
    const searchSnippet = snippet.trim()

    const lineMap = new Map<string, number[]>()
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      if (!lineMap.has(trimmed)) {
        lineMap.set(trimmed, [])
      }
      lineMap.get(trimmed)!.push(i + 1)
    }

    const searchLines = searchSnippet.split("\n")
    const firstLine = searchLines[0].trim()

    const candidates = lineMap.get(firstLine)
    if (!candidates || candidates.length === 0) {
      return "Snippet was not found."
    }

    for (const startLine of candidates) {
      let match = true
      for (let j = 1; j < searchLines.length; j++) {
        const fileLine = lines[startLine - 1 + j]
        if (!fileLine || fileLine.trim() !== searchLines[j].trim()) {
          match = false
          break
        }
      }

      if (match) {
        const endLine = startLine + searchLines.length - 1
        return JSON.stringify({ startLine, endLine }, null, 2)
      }
    }

    return "Snippet was not found."
  } catch (error: any) {
    return `Error: ${error.message}`
  }
}
