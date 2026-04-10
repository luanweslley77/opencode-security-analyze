import { tool } from "@opencode-ai/plugin"
import { promises as fs } from "fs"
import path from "path"
import { execFileAsync } from "../constants.js"

export const installDependenciesTool = tool({
  description: "Executes a dependency installation script in an isolated context.",
  args: {
    scriptPath: tool.schema.string().describe("Absolute path to the installation script."),
    targetFile: tool.schema.string().describe("The target file requiring dependencies."),
    cwd: tool.schema.string().optional().describe("Execution directory (optional)."),
  },
  async execute(args, context) {
    try {
      let execDir = args.cwd

      if (!execDir) {
        const startDir = path.dirname(args.targetFile)
        execDir = startDir

        let current = startDir
        for (let i = 0; i < 5; i++) {
          const hasNode = await fs.access(path.join(current, "package.json")).then(() => true).catch(() => false)
          const hasPy = await fs.access(path.join(current, "requirements.txt")).then(() => true).catch(() => false)
          if (hasNode || hasPy) {
            execDir = current
            break
          }

          const parent = path.dirname(current)
          if (parent === current) break
          current = parent
        }
      }

      await fs.chmod(args.scriptPath, 0o755)

      const { stdout, stderr } = await execFileAsync(args.scriptPath, {
        cwd: execDir!,
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      })

      return JSON.stringify({
        success: true,
        stdout,
        stderr,
      }, null, 2)
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
        stdout: error.stdout || "",
        stderr: error.stderr || "",
      }, null, 2)
    }
  },
})
