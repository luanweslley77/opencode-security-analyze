import { tool } from "@opencode-ai/plugin"
import { promises as fs, existsSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { requireSecurityAgent, execFileAsync } from "../constants.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getOsvScannerBin(): string {
  const ext = process.platform === "win32" ? ".exe" : ""
  const platform = process.platform === "darwin" ? "darwin" : process.platform === "win32" ? "windows" : "linux"
  const arch = process.arch === "arm64" ? "arm64" : "amd64"
  const binPath = path.resolve(__dirname, "..", "..", "osv-scanner", `osv-scanner_${platform}_${arch}${ext}`)

  if (!existsSync(binPath)) {
    throw new Error(`osv-scanner binary not found for ${platform}/${arch} at ${binPath}`)
  }

  return binPath
}

export const securityScanDepsTool = tool({
  description: "Scans project dependencies for known vulnerabilities using the OSV database via osv-scanner v2 CLI. Uses bundled binary.",
  args: {
    path: tool.schema.string().optional().describe("Path to lockfile or project directory (defaults to project root)."),
    format: tool.schema.enum(["text", "json"]).optional().describe("Output format (defaults to text)."),
  },
  async execute(args, context) {
    requireSecurityAgent(context.agent)
    try {
      const targetPath = args.path || context.directory
      const binPath = getOsvScannerBin()
      const { stdout, stderr } = await execFileAsync(binPath, ["scan", "source", "-r", "-f", "json", targetPath], {
        timeout: 120000,
        maxBuffer: 20 * 1024 * 1024,
      })

      const jsonStart = stdout.indexOf("{")
      const jsonEnd = stdout.lastIndexOf("}")
      const jsonStr = jsonStart !== -1 && jsonEnd !== -1 ? stdout.slice(jsonStart, jsonEnd + 1) : stdout
      const data = JSON.parse(jsonStr)

      if (args.format === "json") {
        const outputPath = path.join(context.directory, ".opencode_security", "deps_scan.json")
        await fs.mkdir(path.join(context.directory, ".opencode_security"), { recursive: true })
        await fs.writeFile(outputPath, JSON.stringify(data, null, 2), "utf-8")
        return `Dependency scan results saved to .opencode_security/deps_scan.json`
      }

      if (!data.results || data.results.length === 0) return "No vulnerabilities found in dependencies."

      const findings: Array<Record<string, string>> = []
      for (const result of data.results) {
        if (!result.packages) continue
        for (const pkg of result.packages) {
          const packageInfo = pkg.package?.name || "unknown"
          const version = pkg.package?.version || "unknown"
          for (const vuln of pkg.vulnerabilities || []) {
            let maxSeverity = "LOW"
            const cvss = vuln.database_specific?.cvssScore
            if (cvss >= 9.0) maxSeverity = "CRITICAL"
            else if (cvss >= 7.0) maxSeverity = "HIGH"
            else if (cvss >= 4.0) maxSeverity = "MEDIUM"

            findings.push({
              id: vuln.id,
              package: `${packageInfo}@${version}`,
              severity: maxSeverity,
              summary: vuln.summary || vuln.details || "No description available",
              url: `https://osv.dev/vulnerability/${vuln.id}`,
            })
          }
        }
      }

      if (findings.length === 0) return "No vulnerabilities found in dependencies."

      findings.sort((a, b) => {
        const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        return (order[a.severity] || 4) - (order[b.severity] || 4)
      })

      let report = `## Dependency Vulnerability Scan Results\n\nFound **${findings.length}** vulnerability(s) in project dependencies.\n\n`
      for (const f of findings) {
        report += `### ${f.id} - ${f.package}\n\n- **Severity:** ${f.severity}\n- **Description:** ${f.summary}\n- **Details:** ${f.url}\n\n`
      }

      report += `## Recommendations\n\n1. **CRITICAL/HIGH**: Update affected packages immediately\n2. **MEDIUM**: Plan updates in next sprint\n3. **LOW**: Monitor for patches\n\n> Note: This tool does NOT automatically update dependencies. Review each finding and update manually.\n`

      return report
    } catch (error: any) {
      return `Dependency scan failed: ${error.message}`
    }
  },
})
