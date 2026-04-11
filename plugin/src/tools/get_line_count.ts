import { tool } from "@opencode-ai/plugin"
import path from "path"
import { requireSecurityAgent } from "../constants.js"
import { getLineCount } from "../filesystem.js"

export const getLineCountTool = tool({
  description: "Gets the total line count of a list of files.",
  args: {
    files: tool.schema.array(tool.schema.string()).describe("A list of file paths."),
  },
  async execute(args, context) {
    requireSecurityAgent(context.agent)
    const absoluteFiles = args.files.map(f => f.startsWith("/") ? f : path.join(context.directory, f))
    const totalLines = getLineCount(absoluteFiles)
    return totalLines.toString()
  },
})
