import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, "..", "plugin", "src")
const DIST = path.join(__dirname, "..", "dist")
const OUT = path.join(DIST, "security.ts")

mkdirSync(DIST, { recursive: true })

const constants = readFileSync(path.join(SRC, "constants.ts"), "utf-8")
const knowledge = readFileSync(path.join(SRC, "knowledge.ts"), "utf-8")
const filesystem = readFileSync(path.join(SRC, "filesystem.ts"), "utf-8")
const security = readFileSync(path.join(SRC, "security.ts"), "utf-8")
const parser = readFileSync(path.join(SRC, "parser.ts"), "utf-8")
const poc = readFileSync(path.join(SRC, "poc.ts"), "utf-8")
const index = readFileSync(path.join(SRC, "index.ts"), "utf-8")

const tools = [
  "security_analyze.ts", "get_audit_scope.ts", "get_files_to_audit.ts",
  "get_line_count.ts", "find_line_numbers.ts", "convert_report_to_json.ts",
  "security_patch_context.ts", "poc_context.ts", "run_poc.ts", "install_dependencies.ts",
  "security_scan_deps.ts", "security_note_adder.ts",
].map(f => readFileSync(path.join(SRC, "tools", f), "utf-8"))

const stripRelativeImports = (content: string) =>
  content.replace(/import \{[^}]*\} from ["']\.[^"']*["']\n?/g, "")
         .replace(/import type \{[^}]*\} from ["']\.[^"']*["']\n?/g, "")
         .replace(/import [a-zA-Z]+ from ["']\.[^"']*["']\n?/g, "")
         .replace(/export \{ SecurityPlugin \}\n?/g, "")
         .replace(/export default \{[^}]*\}\n?/g, "")

const allContent = [
  stripRelativeImports(constants),
  stripRelativeImports(knowledge),
  stripRelativeImports(filesystem),
  stripRelativeImports(security),
  stripRelativeImports(parser),
  stripRelativeImports(poc),
  ...tools.map(stripRelativeImports),
  stripRelativeImports(index),
].join("\n\n")

const cleaned = allContent
  .replace(/export const SECURITY_DIR_NAME/g, "const SECURITY_DIR_NAME")
  .replace(/export const SECURITY_DIR\b/g, "const SECURITY_DIR")
  .replace(/export const execFileAsync\b/g, "const execFileAsync")
  .replace(/export const POC_DIR_NAME/g, "const POC_DIR_NAME")
  .replace(/export const PATH_TRAVERSAL_TEMP_FILE/g, "const PATH_TRAVERSAL_TEMP_FILE")
  .replace(/export const IGNORED_/g, "const IGNORED_")
  .replace(/export async function loadKnowledge/g, "async function loadKnowledge")
  .replace(/export function isGitHubRepository/g, "function isGitHubRepository")
  .replace(/export function getAuditScope/g, "function getAuditScope")
  .replace(/export function getFilesToAudit/g, "function getFilesToAudit")
  .replace(/export function getLineCount/g, "function getLineCount")
  .replace(/export async function detectProjectLanguage/g, "async function detectProjectLanguage")
  .replace(/export async function findLineNumbers/g, "async function findLineNumbers")
  .replace(/export interface Location/g, "interface Location")
  .replace(/export interface Finding/g, "interface Finding")
  .replace(/export function buildPattern/g, "function buildPattern")
  .replace(/export function extractFromSection/g, "function extractFromSection")
  .replace(/export function parseLocation/g, "function parseLocation")
  .replace(/export function parseMarkdownToDict/g, "function parseMarkdownToDict")
  .replace(/export interface RunPocResult/g, "interface RunPocResult")
  .replace(/export async function runPoc/g, "async function runPoc")
  .replace(/export function findProjectRoot/g, "function findProjectRoot")
  .replace(/export const securityScanDepsTool/g, "const securityScanDepsTool")
  .replace(/export const securityNoteAdderTool/g, "const securityNoteAdderTool")
  .replace(/export const securityAnalyzeTool/g, "const securityAnalyzeTool")
  .replace(/export const getAuditScopeTool/g, "const getAuditScopeTool")
  .replace(/export const getFilesToAuditTool/g, "const getFilesToAuditTool")
  .replace(/export const getLineCountTool/g, "const getLineCountTool")
  .replace(/export const findLineNumbersTool/g, "const findLineNumbersTool")
  .replace(/export const convertReportToJsonTool/g, "const convertReportToJsonTool")
  .replace(/export const securityPatchContextTool/g, "const securityPatchContextTool")
  .replace(/export const pocContextTool/g, "const pocContextTool")
  .replace(/export const runPocTool/g, "const runPocTool")
  .replace(/export const installDependenciesTool/g, "const installDependenciesTool")
  .replace(/export const SecurityPlugin/g, "const SecurityPlugin")

writeFileSync(OUT, cleaned + "\n\nexport { SecurityPlugin }\nexport default { id: \"security\", server: SecurityPlugin }\n")
if (existsSync(path.join(SRC, "knowledge"))) {
  cpSync(path.join(SRC, "knowledge"), path.join(DIST, "knowledge"), { recursive: true })
}

console.log(`Built: ${OUT}`)
console.log(`Size: ${(cleaned.length / 1024).toFixed(1)} KB, Lines: ${cleaned.split("\n").length}`)
