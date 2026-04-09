import { tool } from "@opencode-ai/plugin"
import { findLineNumbers } from "../security.js"

export const findLineNumbersTool = tool({
  description: "Finds the line numbers of a code snippet in a file. Includes path traversal protection.",
  args: {
    filePath: tool.schema.string().describe("The path to the file with the security vulnerability."),
    snippet: tool.schema.string().describe("The code snippet to search for inside the file."),
  },
  async execute(args, context) {
    return findLineNumbers(args.filePath, args.snippet, context.directory)
  },
})
