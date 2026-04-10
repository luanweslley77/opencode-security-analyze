import { tool } from "@opencode-ai/plugin"
import { promises as fs } from "fs"
import path from "path"
import { SECURITY_DIR } from "../constants.js"

export const securityAnalyzeTool = tool({
  description: "Initialize security analysis workspace. Creates SECURITY_ANALYSIS_TODO.md and DRAFT_SECURITY_REPORT.md in the .opencode_security/ directory. Use this as the first step before conducting any security audit.",
  args: {},
  async execute(args, context) {
    const securityDir = path.join(context.directory, SECURITY_DIR)
    await fs.mkdir(securityDir, { recursive: true })

    const todoPath = path.join(securityDir, "SECURITY_ANALYSIS_TODO.md")
    const reportPath = path.join(securityDir, "DRAFT_SECURITY_REPORT.md")

    await fs.writeFile(todoPath, `- [ ] Define the audit scope.
- [ ] Conduct a two-pass SAST analysis on all files within scope.
- [ ] Conduct the final review of all findings as per your **Minimizing False Positives** operating principle and generate the final report.`, { encoding: "utf-8" })

    await fs.writeFile(reportPath, "", { encoding: "utf-8" })

    return `Security analysis workspace initialized at ${SECURITY_DIR}/
- Created SECURITY_ANALYSIS_TODO.md with initial plan
- Created DRAFT_SECURITY_REPORT.md for findings
- Use get_audit_scope to identify files to analyze
- Use find_line_numbers to get exact line numbers for vulnerabilities
- When done, use convert_report_to_json if JSON output is needed
- Clean up temporary files after delivering the final report`
  },
})
