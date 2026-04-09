import { promises as fs } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export type VulnerabilityType = "scan_deps" | "path_traversal" | "other"

const KNOWLEDGE_DIR = path.join(__dirname, "knowledge")

export async function loadKnowledge(vulnerability: string): Promise<string> {
  const sanitizedName = vulnerability.replace(/[^a-z0-9_]/gi, "")
  const knowledgeFile = path.join(KNOWLEDGE_DIR, `${sanitizedName}.md`)

  try {
    return await fs.readFile(knowledgeFile, "utf-8")
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return `No knowledge base article found for vulnerability type: ${vulnerability}`
    }
    throw error
  }
}
