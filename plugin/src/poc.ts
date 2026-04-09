import { exec, execFile } from "child_process"
import { promisify } from "util"
import { promises as fs, existsSync } from "fs"
import path from "path"
import { PATH_TRAVERSAL_TEMP_FILE, POC_DIR_NAME } from "./constants.js"

const execAsync = promisify(exec)
const execFileAsync = promisify(execFile)

export interface RunPocResult {
  stdout: string
  stderr: string
  error?: string
  isSecurityError?: boolean
}

export async function runPoc(
  filePath: string,
  cwd: string
): Promise<RunPocResult> {
  const pocDir = path.join(cwd, POC_DIR_NAME)
  const normalizedPocDir = path.resolve(pocDir) + path.sep
  const resolvedPath = path.resolve(filePath)

  if (!resolvedPath.startsWith(normalizedPocDir)) {
    return {
      stdout: "",
      stderr: "",
      error: "PoC file must be within the poc/ directory",
      isSecurityError: true,
    }
  }

  let tempFilePath: string | null = null
  const ext = path.extname(filePath).toLowerCase()

  try {
    if (path.basename(filePath).includes("path_traversal")) {
      tempFilePath = path.join(cwd, PATH_TRAVERSAL_TEMP_FILE)
      await fs.writeFile(tempFilePath, "This is a test file for path traversal verification.\n", "utf-8")
    }

    switch (ext) {
      case ".py":
        return await runPythonPoc(filePath, cwd)
      case ".go":
        return await runGoPoc(filePath, cwd)
      case ".ts":
        return await runTypeScriptPoc(filePath, cwd)
      case ".js":
      default:
        return await runNodePoc(filePath, cwd)
    }
  } catch (error: any) {
    return {
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      error: error.message || String(error),
    }
  } finally {
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {})
    }
  }
}

async function runPythonPoc(filePath: string, pocDir: string): Promise<RunPocResult> {
  const venvPath = path.join(pocDir, ".venv")
  const pythonPath = path.join(venvPath, "bin", "python")

  try {
    await execFileAsync("python3", ["-m", "venv", venvPath])
  } catch {
    await execFileAsync("python", ["-m", "venv", venvPath])
  }

  const projectRoot = findProjectRoot(pocDir)
  if (projectRoot) {
    const hasPyproject = await fs.access(path.join(projectRoot, "pyproject.toml")).then(() => true).catch(() => false)
    const hasRequirements = await fs.access(path.join(projectRoot, "requirements.txt")).then(() => true).catch(() => false)

    if (hasPyproject) {
      await execFileAsync(pythonPath, ["-m", "pip", "install", "-e", projectRoot], { cwd: pocDir })
    } else if (hasRequirements) {
      await execFileAsync(pythonPath, ["-m", "pip", "install", "-r", path.join(projectRoot, "requirements.txt")], { cwd: pocDir })
    }
  }

  const pocHasPyproject = await fs.access(path.join(pocDir, "pyproject.toml")).then(() => true).catch(() => false)
  const pocHasRequirements = await fs.access(path.join(pocDir, "requirements.txt")).then(() => true).catch(() => false)

  if (pocHasPyproject) {
    await execFileAsync(pythonPath, ["-m", "pip", "install", "."], { cwd: pocDir })
  } else if (pocHasRequirements) {
    await execFileAsync(pythonPath, ["-m", "pip", "install", "-r", "requirements.txt"], { cwd: pocDir })
  }

  try {
    const { stdout, stderr } = await execFileAsync(pythonPath, [filePath], { cwd: pocDir })
    return { stdout, stderr }
  } catch (error: any) {
    if (error.message?.includes("ModuleNotFoundError")) {
      await execFileAsync("python3", ["-m", "venv", "--system-site-packages", venvPath]).catch(() => {})
      const { stdout, stderr } = await execFileAsync(pythonPath, [filePath], { cwd: pocDir }).catch((e: any) => e)
      return { stdout: stdout || "", stderr: stderr || "", error: error.message }
    }
    return { stdout: error.stdout || "", stderr: error.stderr || "", error: error.message }
  }
}

async function runGoPoc(filePath: string, cwd: string): Promise<RunPocResult> {
  const goModPath = path.join(path.dirname(filePath), "go.mod")
  const hasGoMod = await fs.access(goModPath).then(() => true).catch(() => false)

  if (!hasGoMod) {
    await execFileAsync("go", ["mod", "init", "poc"], { cwd: path.dirname(filePath) })
  }

  await execFileAsync("go", ["mod", "tidy"], { cwd: path.dirname(filePath) })

  const { stdout, stderr } = await execFileAsync("go", ["run", filePath], { cwd })
  return { stdout, stderr }
}

async function runTypeScriptPoc(filePath: string, cwd: string): Promise<RunPocResult> {
  const cacheDir = path.join(path.dirname(filePath), ".npx_cache")
  const env = { ...process.env, npm_config_cache: cacheDir }

  const { stdout, stderr } = await execFileAsync("npx", ["ts-node", filePath], { cwd, env })
  return { stdout, stderr }
}

async function runNodePoc(filePath: string, cwd: string): Promise<RunPocResult> {
  const { stdout, stderr } = await execFileAsync("node", [filePath], { cwd })
  return { stdout, stderr }
}

function findProjectRoot(startDir: string): string | null {
  let current = startDir
  for (let i = 0; i < 5; i++) {
    const hasPackageJson = existsSync(path.join(current, "package.json"))
    const hasPyproject = existsSync(path.join(current, "pyproject.toml"))
    const hasRequirements = existsSync(path.join(current, "requirements.txt"))
    const hasGoMod = existsSync(path.join(current, "go.mod"))

    if (hasPackageJson || hasPyproject || hasRequirements || hasGoMod) {
      return current
    }

    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return null
}
