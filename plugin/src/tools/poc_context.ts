import { tool } from "@opencode-ai/plugin"
import { promises as fs } from "fs"
import path from "path"
import { detectProjectLanguage } from "../filesystem.js"
import { SECURITY_DIR_NAME, POC_DIR_NAME, PATH_TRAVERSAL_TEMP_FILE } from "../constants.js"

export const pocContextTool = tool({
  description: "Sets up the necessary workspace and directories to test a vulnerability, returning the context variables needed to generate the PoC. Call this tool as part of the poc skill.",
  args: {
    problemStatement: tool.schema.string().describe("Raw vulnerability description from user."),
    vulnerabilityType: tool.schema.enum(["path_traversal", "other"]).describe("Type of vulnerability (inferred from problemStatement)."),
    sourceCodeLocation: tool.schema.string().describe("Exact file path and function/line of vulnerable code."),
  },
  async execute(args, context) {
    try {
      const language = await detectProjectLanguage()

      const extMap: Record<string, string> = {
        "Node.js": ".ts",
        "Python": ".py",
        "Go": ".go",
        "Unknown": ".js",
      }
      const ext = extMap[language]

      const pocDir = path.join(context.directory, SECURITY_DIR_NAME, POC_DIR_NAME)
      await fs.mkdir(pocDir, { recursive: true })

      const timestamp = Date.now()
      const pocFileName = `poc_${args.vulnerabilityType}_${timestamp}${ext}`

      let extraInstructions = ""
      if (args.vulnerabilityType === "path_traversal") {
        extraInstructions = `A temporary test file will be automatically created at the workspace root (${PATH_TRAVERSAL_TEMP_FILE}) for your PoC to attempt to read. This file contains test content for verification purposes.`
      }

      return JSON.stringify({
        context: {
          problemStatement: args.problemStatement,
          sourceCodeLocation: args.sourceCodeLocation,
          vulnerabilityType: args.vulnerabilityType,
          language,
        },
        pocDir,
        pocFileName,
        extraInstructions,
      }, null, 2)
    } catch (error: any) {
      return `Error setting up PoC context: ${error.message}`
    }
  },
})
