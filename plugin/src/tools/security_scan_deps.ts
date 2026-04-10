import { tool } from "@opencode-ai/plugin"
import { promises as fs, existsSync } from "fs"
import path from "path"
import { execFileAsync } from "../constants.js"

async function ensureOsvScanner(): Promise<string> {
  const cacheDir = path.join(process.env.HOME || process.env.USERPROFILE || ".", ".cache", "opencode", "osv-scanner")
  const ext = process.platform === "win32" ? ".exe" : ""
  const binName = `osv-scanner${ext}`
  const binPath = path.join(cacheDir, binName)

  if (existsSync(binPath)) return binPath

  const platform = process.platform === "darwin" ? "darwin" : process.platform === "win32" ? "windows" : "linux"
  const arch = process.arch === "arm64" ? "arm64" : "amd64"
  const version = "v1.8.4"
  const filename = `osv-scanner_${platform}_${arch}${ext}`
  const url = `https://github.com/google/osv-scanner/releases/download/${version}/${filename}`

  await fs.mkdir(cacheDir, { recursive: true })

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download osv-scanner: ${res.status} ${res.statusText}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(binPath, buffer)
  await fs.chmod(binPath, 0o755)

  return binPath
}

export const securityScanDepsTool = tool({
  description: "Scans project dependencies for known vulnerabilities using the OSV database via osv-scanner CLI. Automatically downloads osv-scanner on first use.",
  args: {
    path: tool.schema.string().optional().describe("Path to lockfile or project directory (defaults to project root)."),
    format: tool.schema.enum(["text", "json"]).optional().describe("Output format (defaults to text)."),
  },
  async execute(args, context) {
    try {
      const targetPath = args.path || context.directory
      const binPath = await ensureOsvScanner()
      const { stdout, stderr } = await execFileAsync(binPath, ["--lockfile", targetPath, "--format", "json", "--recursive"], {
        timeout: 120000,
        maxBuffer: 20 * 1024 * 1024,
      })

      if (args.format === "json") {
        const outputPath = path.join(context.directory, ".opencode_security", "deps_scan.json")
        await fs.mkdir(path.join(context.directory, ".opencode_security"), { recursive: true })
        await fs.writeFile(outputPath, stdout, "utf-8")
        return `Dependency scan results saved to .opencode_security/deps_scan.json`
      }

      const data = JSON.parse(stdout)
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
