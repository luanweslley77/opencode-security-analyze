import { tool } from "@opencode-ai/plugin"
import { promises as fs } from "fs"
import path from "path"
import { requireSecurityAgent, SECURITY_DIR } from "../constants.js"
import { parseMarkdownToDict } from "../parser.js"

export const convertReportToJsonTool = tool({
  description: "Converts the Markdown security report into a JSON file named security_report.json in the .opencode_security/ folder.",
  args: {},
  async execute(args, context) {
    requireSecurityAgent(context.agent)
    try {
      const reportPath = path.join(context.directory, SECURITY_DIR, "DRAFT_SECURITY_REPORT.md")
      const outputPath = path.join(context.directory, SECURITY_DIR, "security_report.json")

      const content = await fs.readFile(reportPath, "utf-8")
      const findings = parseMarkdownToDict(content)

      await fs.writeFile(outputPath, JSON.stringify(findings, null, 2), "utf-8")

      return `Successfully created JSON report at ${SECURITY_DIR}/security_report.json with ${findings.length} findings.`
    } catch (error: any) {
      return `Error converting report to JSON: ${error.message}`
    }
  },
})
