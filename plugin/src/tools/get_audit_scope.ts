import { tool } from "@opencode-ai/plugin"
import { getAuditScope } from "../filesystem.js"

export const getAuditScopeTool = tool({
  description: "Gets the git diff of the current changes. Can optionally compare two specific branches.",
  args: {
    base: tool.schema.string().optional().describe("The base branch or commit hash (e.g., 'main')."),
    head: tool.schema.string().optional().describe("The head branch or commit hash (e.g., 'feature-branch')."),
  },
  async execute(args, context) {
    return getAuditScope(args.base, args.head)
  },
})
