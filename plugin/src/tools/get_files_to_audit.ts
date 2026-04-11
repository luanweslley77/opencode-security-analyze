import { tool } from "@opencode-ai/plugin"
import path from "path"
import { requireSecurityAgent } from "../constants.js"
import { getFilesToAudit } from "../filesystem.js"

export const getFilesToAuditTool = tool({
  description: "Lists relevant files for auditing by filtering out irrelevant files and folders.",
  args: {},
  async execute(args, context) {
    requireSecurityAgent(context.agent)
    const files = getFilesToAudit()
    const absoluteFiles = files.map(f => path.join(context.directory, f))
    return absoluteFiles.length > 0
      ? absoluteFiles.join("\n")
      : "No files to audit."
  },
})
