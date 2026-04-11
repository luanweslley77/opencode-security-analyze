import { tool } from "@opencode-ai/plugin"
import { promises as fs, existsSync } from "fs"
import path from "path"
import { requireSecurityAgent } from "../constants.js"

export const securityNoteAdderTool = tool({
  description: "Creates a new security note file or appends to an existing one in .opencode_security/notes/. Used for maintaining vulnerability allowlists (vuln_allowlist.txt) and analysis notes.",
  args: {
    note_name: tool.schema.string().describe("Name of note file (e.g., 'vuln_allowlist.txt', 'analysis_notes.md')."),
    content: tool.schema.string().describe("Content to add to the note."),
    mode: tool.schema.enum(["append", "create", "overwrite"]).optional().describe("Write mode. Defaults to 'append' if file exists, 'create' otherwise."),
  },
  async execute(args, context) {
    requireSecurityAgent(context.agent)
    try {
      const notesDir = path.join(context.directory, ".opencode_security", "notes")
      await fs.mkdir(notesDir, { recursive: true })
      const notePath = path.join(notesDir, args.note_name)
      const fileExists = existsSync(notePath)
      const mode = args.mode || (fileExists ? "append" : "create")

      if (mode === "create" || !fileExists) {
        await fs.writeFile(notePath, args.content, "utf-8")
        return `Created new note at .opencode_security/notes/${args.note_name}`
      } else if (mode === "overwrite") {
        await fs.writeFile(notePath, args.content, "utf-8")
        return `Overwrote note at .opencode_security/notes/${args.note_name}`
      } else {
        const existing = await fs.readFile(notePath, "utf-8")
        const separator = existing.endsWith("\n") ? "\n" : "\n\n"
        await fs.writeFile(notePath, existing + separator + args.content, "utf-8")
        return `Appended to note at .opencode_security/notes/${args.note_name}`
      }
    } catch (error: any) {
      return `Error managing note: ${error.message}`
    }
  },
})
