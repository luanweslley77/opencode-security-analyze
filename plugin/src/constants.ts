import { execFile } from "child_process"
import { promisify } from "util"

export const SECURITY_DIR_NAME = ".opencode_security"

export const POC_DIR_NAME = "poc"

export const PATH_TRAVERSAL_TEMP_FILE = "gcli_secext_path_traversal_test.txt"

export const SECURITY_DIR = SECURITY_DIR_NAME

export const execFileAsync = promisify(execFile)

export const IGNORED_FOLDERS = [
  "node_modules", "dist", "build", "out", "target", "bin", "obj", "vendor",
  "docs", "documentation", "tests", "test", "spec", "__tests__", ".github",
  ".vscode", ".idea", ".git", "assets", "images", "public/assets", ".next",
  ".nuxt", ".svelte-kit", "bower_components", "jspm_packages", ".npm",
  ".yarn", ".pnpm", "coverage", ".cache", ".tmp", "temp",
]

export const IGNORED_FILES = [
  "LICENSE", "CHANGELOG", "CONTRIBUTING", "CODE_OF_CONDUCT", "SECURITY.md",
  ".gitignore", ".prettierrc", ".eslintrc", ".eslintignore", ".prettierignore",
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "go.sum", "Cargo.lock",
  "Gemfile.lock", "composer.lock", "npm-debug.log", "yarn-debug.log",
  "yarn-error.log", ".env.example", ".env.template", ".env.dist",
]

export const IGNORED_EXTENSIONS = [
  ".md", ".txt", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp", ".tiff",
  ".mp4", ".mov", ".avi", ".wmv", ".mkv", ".mp3", ".wav", ".flac", ".ogg",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".lock", "-lock.json", ".sum",
  ".exe", ".dll", ".so", ".dylib", ".pyc", ".class", ".pyo", ".o", ".obj",
  ".DS_Store", ".gitkeep", ".dockerignore", ".eslintignore", ".prettierignore",
  ".editorconfig", ".map",
  ".test.ts", ".test.js", ".spec.ts", ".spec.js",
  ".test.tsx", ".test.jsx", ".spec.tsx", ".spec.jsx",
]
