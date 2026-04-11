import { tool } from "@opencode-ai/plugin"
import { requireSecurityAgent } from "../constants.js"
import { runPoc } from "../poc.js"

export const runPocTool = tool({
  description: "Executes a Proof-of-Concept script from the poc/ directory and returns the output. Use this to verify vulnerabilities before and after patching.",
  args: {
    filePath: tool.schema.string().describe("Absolute path to the PoC file to execute."),
  },
  async execute(args, context) {
    requireSecurityAgent(context.agent)
    const result = await runPoc(args.filePath, context.directory)

    if (result.isSecurityError) {
      return `Security Error: ${result.error}`
    }

    return JSON.stringify({
      success: !result.error,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error || undefined,
    }, null, 2)
  },
})
