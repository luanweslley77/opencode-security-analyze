import { tool } from "@opencode-ai/plugin"
import { promises as fs } from "fs"
import path from "path"
import { loadKnowledge, VulnerabilityType } from "../knowledge.js"

const SECURITY_DIR = ".opencode_security"

export const securityPatchContextTool = tool({
  description: "Fetches context about a security vulnerability in a given file including knowledge base rules and file content. Use this before patching vulnerabilities.",
  args: {
    vulnerability: tool.schema.enum(["scan_deps", "path_traversal", "other"]).describe("The vulnerability type for knowledge base lookup."),
    filePath: tool.schema.string().describe("Absolute path to file needing patching."),
    pocFilePath: tool.schema.string().describe("Absolute path to PoC file (or empty string)."),
    vulnerabilityContext: tool.schema.string().describe("Description of vulnerability with line numbers."),
  },
  async execute(args, context) {
    try {
      const knowledge = await loadKnowledge(args.vulnerability)

      const filePath = args.filePath.startsWith("/")
        ? args.filePath
        : path.join(context.directory, args.filePath)

      let fileContent = "Could not read file."
      try {
        fileContent = await fs.readFile(filePath, "utf-8")
      } catch {
        // Gracefully handle read errors
      }

      return `## Knowledge Base
${knowledge}

## Vulnerability Context
${args.vulnerabilityContext}

## Target File
${filePath}

## PoC File
${args.pocFilePath || "Not provided"}

## File Content
\`\`\`
${fileContent}
\`\`\`

## Next Steps
Use the security-patcher skill to generate and apply a fix based on this context.`
    } catch (error: any) {
      return `Error getting patch context: ${error.message}`
    }
  },
})
