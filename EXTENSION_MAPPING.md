task_id: ses_28b5328fdffeXho3uaiM3o6gb1 (for resuming to continue this task if needed)

<task_result>
Here is the complete, cleaned-up markdown document:

---

# COMPREHENSIVE MAPPING: Gemini CLI Security Extension v0.5.0

## 1. Executive Summary

The **Gemini CLI Security Extension** is an open-source security analysis extension for the Gemini CLI, built by Google and distributed under the Apache 2.0 license. It provides AI-powered static application security testing (SAST) capabilities directly within the Gemini CLI environment, enabling developers to identify security vulnerabilities and privacy violations in their code.

### What It Does

The extension adds security analysis commands to the Gemini CLI that:
- **Analyze code changes** (diffs/PRs) for common security vulnerabilities
- **Scan entire repositories** for security and privacy issues
- **Run dependency scans** using OSV-Scanner to find vulnerable dependencies
- **Generate Proof-of-Concept (PoC)** scripts to reproduce vulnerabilities
- **Apply security patches** to fix identified vulnerabilities
- **Integrate with GitHub Actions** for automated PR security reviews

### How It Works

The extension has four major components that work together:

1. **MCP Server** -- A Model Context Protocol server (`mcp-server/`) that exposes 10 security tools via the MCP protocol, providing the "backend" that Gemini's AI model calls to perform security operations.
2. **Commands** (`commands/security/`) -- Three TOML-defined Gemini CLI commands that orchestrate the MCP tools into structured security analysis workflows.
3. **Skills** (`skills/`) -- Three SKILL.md files that define operational procedures for patching, PoC generation, and dependency management.
4. **GEMINI.md** -- Persistent context file that provides SAST guidelines, security taxonomy, severity assessment rubrics, and reporting standards to the Gemini AI model.

### Current Version

- **Extension Version:** 0.5.0 (as defined in `gemini-extension.json`)
- **MCP Server:** `gemini-cli-security-mcp-server` (Node.js, ESM)
- **Dependencies:** `@modelcontextprotocol/sdk` ^1.24.0, `zod` ^3.25.76
- **Test Framework:** Vitest ^3.2.4
- **License:** Apache 2.0

---

## 2. Complete File Tree

```
/home/fallen33/security/
├── .git/                                    # Git repository metadata
├── .github/                                 # GitHub configuration
│   ├── CODEOWNERS                           # Code ownership definitions
│   ├── release-please.yml                   # Release Please configuration
│   └── workflows/
│       ├── gemini-review.yml                # GitHub Action: Gemini review + security analysis
│       ├── license.yml                      # GitHub Action: License header validation
│       └── package-and-upload-assets.yml    # GitHub Action: Build, package, and release
├── .gitignore                               # Git ignore patterns
├── .release-please-manifest.json            # Release Please version manifest ("0.5.0")
├── assets/
│   ├── gemini-cli-security-extension-workflow.gif  # Workflow demo GIF
│   └── customize_command.gif                # Command customization demo GIF
├── CHANGELOG.md                             # Version history (v0.1.0 through v0.5.0)
├── commands/
│   └── security/
│       ├── analyze.toml                     # Command: Analyze current branch changes
│       ├── analyze-full.toml                # Command: Analyze entire repository
│       └── analyze-github-pr.toml           # Command: Analyze GitHub PR (CI/CD)
├── CONTRIBUTING.md                          # Contribution guidelines (CLA, code review)
├── docs/
│   └── releases.md                          # Release process documentation
├── gemini-extension.json                    # Extension manifest (name, version, MCP servers)
├── GEMINI.md                                # Persistent context: SAST guidelines & security SOPs
├── LICENSE                                  # Apache 2.0 License
├── mcp-server/                              # MCP Server (the backend)
│   ├── package.json                         # Node.js package definition
│   ├── package-lock.json                    # Dependency lock file
│   ├── tsconfig.json                        # TypeScript compiler configuration
│   └── src/
│       ├── index.ts                         # MCP Server entry point (317 lines)
│       ├── constants.ts                     # Directory names, ignore lists (46 lines)
│       ├── filesystem.ts                    # Git operations, file discovery (162 lines)
│       ├── security.ts                      # findLineNumbers with path traversal protection (120 lines)
│       ├── parser.ts                        # Markdown-to-JSON security report parser (172 lines)
│       ├── knowledge.ts                     # Knowledge base loader (37 lines)
│       ├── poc.ts                           # Multi-language PoC execution engine (201 lines)
│       ├── knowledge/
│       │   └── path_traversal.md            # Path traversal remediation knowledge (51 lines)
│       └── tools/
│           ├── security_patch_context.ts    # Security patch context tool (66 lines)
│           ├── security_patch_context.test.ts # Tests for patch context (80 lines)
│           ├── poc_context.ts               # PoC context setup tool (83 lines)
│           └── run_poc.ts                   # PoC execution tool (48 lines)
│       # Test files (at src/ root)
│       ├── filesystem.test.ts               # Filesystem module tests (116 lines)
│       ├── knowledge.test.ts                # Knowledge loader tests (66 lines)
│       ├── knowledge.integration.test.ts    # Knowledge integration test (16 lines)
│       ├── parser.test.ts                   # Report parser tests (282 lines)
│       ├── security.test.ts                 # Line number finder tests (134 lines)
│       └── poc.test.ts                      # PoC engine tests (155 lines)
├── README.md                                # Main documentation
├── release-please-config.json               # Release Please configuration
├── SECURITY.md                              # Security reporting instructions
└── skills/
    ├── security-patcher/
    │   └── SKILL.md                         # Security patching procedure (31 lines)
    ├── poc/
    │   └── SKILL.md                         # PoC generation procedure (26 lines)
    └── dependency-manager/
        └── SKILL.md                         # Dependency isolation procedure (24 lines)
```

**Total Source Files:** 27 (excluding .git, tests, lockfiles, images)  
**Total Lines of TypeScript:** ~1,868 (source only, excluding tests)  
**Total Lines of Tests:** ~849

---

## 3. Component 1: MCP Server

### 3.1 Overview

**Location:** `/home/fallen33/security/mcp-server/`  
**Package Name:** `gemini-cli-security-mcp-server`  
**Type:** Node.js ESM module  
**Entry Point:** `src/index.ts`  
**Transport:** StdioServerTransport (MCP protocol over stdin/stdout)

### 3.2 Server Initialization

```typescript
const server = new McpServer({
  name: 'gemini-cli-security',
  version: '0.1.0',
});
```

The server starts via `startServer()` which creates a `StdioServerTransport` and connects.

### 3.3 All MCP Tools (10 total)

#### Tool 1: `find_line_numbers`

- **Description:** Finds the line numbers of a code snippet in a file
- **Parameters:**
  - `filePath` (string): Path to the file with the security vulnerability
  - `snippet` (string): The code snippet to search for
- **Implementation:** `src/security.ts` -- `findLineNumbers()`
- **Security Features:**
  - Uses `fs.realpath()` to resolve symlinks
  - Validates that resolved path starts within CWD (prevents path traversal)
  - Returns `{ startLine, endLine }` JSON
- **Error Responses:**
  - "File path is outside of the current working directory."
  - "Snippet is empty."
  - "Snippet was not found."

#### Tool 2: `get_audit_scope`

- **Description:** Gets the git diff of current changes; can optionally compare two branches
- **Parameters:**
  - `base` (string, optional): Base branch or commit hash
  - `head` (string, optional): Head branch or commit hash
- **Implementation:** `src/filesystem.ts` -- `getAuditScope()`
- **Behavior:**
  - If no args: gets working directory diff
  - If GitHub repo (checked via `git remote -v` for `github.com`): uses `git diff --merge-base origin/HEAD`
  - If both base and head provided: `git diff <base> <head>`
- **Returns:** Raw git diff string

#### Tool 3: `get_files_to_audit`

- **Description:** Lists relevant files for auditing by filtering out irrelevant files/folders
- **Parameters:** None
- **Implementation:** `src/filesystem.ts` -- `getFilesToAudit()`
- **Method:**
  - Gets tracked files via `git ls-files`
  - Gets untracked files via `git ls-files --others --exclude-standard`
  - Filters out:
    - Files in `IGNORED_FOLDERS` (node_modules, dist, build, tests, etc.)
    - Files matching `IGNORED_EXTENSIONS` (.md, .txt, .png, .lock, .test.ts, etc.)
    - Files matching `IGNORED_FILES` (LICENSE, CHANGELOG, .gitignore, lockfiles, etc.)
- **Returns:** Newline-separated list of file paths

#### Tool 4: `run_poc`

- **Description:** Runs the generated PoC code
- **Parameters:**
  - `filePath` (string): Absolute path to the PoC file to run
- **Implementation:** `src/tools/run_poc.ts` -- `getRunPocMessages()` -> `src/poc.ts` -- `runPoc()`
- **Supported Languages:** Python (.py), Go (.go), TypeScript (.ts), JavaScript (.js)
- **Security:** Validates filePath is within POC_DIR (path traversal protection)
- **Returns:** Formatted stdout/stderr output

#### Tool 5: `convert_report_to_json`

- **Description:** Converts the Markdown security report into a JSON file
- **Parameters:** None
- **Implementation:** Inline in `index.ts`, uses `src/parser.ts` -- `parseMarkdownToDict()`
- **Input:** Reads `.gemini_security/DRAFT_SECURITY_REPORT.md`
- **Output:** Writes `.gemini_security/security_report.json`
- **Returns:** Success message with output path

#### Tool 6: `security_patch_context`

- **Description:** Fetches context about a security vulnerability in a given file
- **Parameters:**
  - `vulnerability` (enum: `scan_deps`, `path_traversal`, `other`): Type of vulnerability
  - `filePath` (string): Absolute path to file needing patching
  - `pocFilePath` (string): Absolute path to PoC file (or empty string)
  - `vulnerabilityContext` (string): Description of the vulnerability
- **Implementation:** `src/tools/security_patch_context.ts` -- `getSecurityPatchContextMessages()`
- **Behavior:**
  - Loads knowledge base article via `loadKnowledge(vulnerability)`
  - Reads target file content
  - Returns structured context with Knowledge Base, Context, Target File, PoC File, File Content, and Next Steps
- **Note:** Description states "Do not call this tool directly from a user prompt; instead, you MUST invoke the `security-patcher` skill"

#### Tool 7: `poc_context`

- **Description:** Sets up workspace, directories, and dependencies for PoC testing
- **Parameters:**
  - `problemStatement` (string): Raw description of the security problem
  - `vulnerabilityType` (enum: `path_traversal`, `other`): Inferred from problem statement
  - `sourceCodeLocation` (string): Exact file path and function/line number
- **Implementation:** `src/tools/poc_context.ts` -- `getPocContext()`
- **Behavior:**
  - Detects project language (Node.js, Python, Go, Unknown)
  - Creates PoC directory (`.gemini_security/poc/`)
  - Generates timestamped PoC filename with correct extension
  - For path_traversal: adds extra instructions about automatic temp file
  - Returns JSON with: `context`, `pocDir`, `pocFileName`, `extraInstructions`

#### Tool 8: `install_dependencies`

- **Description:** Executes a script file inside workspace
- **Parameters:**
  - `scriptPath` (string): Absolute path to script file to execute
  - `targetFile` (string): The target file requiring dependencies
  - `cwd` (string, optional): Execution directory
- **Implementation:** Inline in `index.ts`
- **Behavior:**
  - If no `cwd` provided, walks up from `targetFile` directory (max 5 levels) to find `package.json` or `requirements.txt`
  - Makes script executable (chmod 755)
  - Executes script using `execFile`
- **Returns:** JSON with stdout and stderr

#### Tool 9: `get_line_count`

- **Description:** Gets the total line count of a list of files
- **Parameters:**
  - `files` (string[]): List of file paths
- **Implementation:** `src/filesystem.ts` -- `getLineCount()`
- **Returns:** Total line count as string

### 3.4 MCP Prompts (2 total)

#### Prompt 1: `security:note-adder`

- **Type:** Registered Prompt (`server.registerPrompt`)
- **Description:** Creates a new note file or adds entry to existing one
- **Parameters:**
  - `notePath` (string): Path to the note file
  - `content` (string): Content to add
- **Behavior:**
  - Prompts the AI to read/write files in `.gemini_security/`
  - Ensures format consistency for notes like `vuln_allowlist.txt`
  - If file doesn't exist: asks user for template
  - If file exists: checks format consistency before appending
- **Usage:** Used for managing vulnerability allowlists

#### Prompt 2: `security:scan_deps`

- **Type:** Registered Prompt (`server.registerPrompt`)
- **Description:** [Experimental] Scans dependencies for known vulnerabilities
- **Parameters:** None
- **Behavior:**
  - Instructs the AI to use osvScanner MCP server tools
  - Workflow:
    1. Run `scan_vulnerable_dependencies` (recursive, absolute path)
    2. Analyze report (ignore lockfiles in test directories)
    3. Prioritize vulnerabilities by severity
    4. Use `get_vulnerability_details` for more info if needed
  - Explicitly instructs NOT to automatically update dependencies
- **External Dependency:** Requires `osvScanner` MCP server (from `gemini-extension.json`)

### 3.5 Internal Modules

#### `src/constants.ts` (46 lines)

Defines all configuration constants:

```typescript
export const SECURITY_DIR_NAME = '.gemini_security';
export const POC_DIR_NAME = 'poc';
export const SECURITY_DIR = path.join(process.cwd(), SECURITY_DIR_NAME);
export const POC_DIR = path.join(SECURITY_DIR, POC_DIR_NAME);
```

**IGNORED_FOLDERS** (24 entries):  
`node_modules`, `dist`, `build`, `out`, `target`, `bin`, `obj`, `vendor`, `docs`, `documentation`, `tests`, `test`, `spec`, `__tests__`, `.github`, `.vscode`, `.idea`, `.git`, `assets`, `images`, `public/assets`, `.next`, `.nuxt`, `.svelte-kit`, `bower_components`, `jspm_packages`, `.npm`, `.yarn`, `.pnpm`, `coverage`, `.cache`, `.tmp`, `temp`

**IGNORED_EXTENSIONS** (37 entries):  
`.md`, `.txt`, `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`, `.webp`, `.bmp`, `.tiff`, `.mp4`, `.mov`, `.avi`, `.wmv`, `.mkv`, `.mp3`, `.wav`, `.flac`, `.ogg`, `.woff`, `.woff2`, `.ttf`, `.eot`, `.otf`, `.lock`, `-lock.json`, `.sum`, `.exe`, `.dll`, `.so`, `.dylib`, `.pyc`, `.class`, `.pyo`, `.o`, `.obj`, `.DS_Store`, `.gitkeep`, `.dockerignore`, `.eslintignore`, `.prettierignore`, `.editorconfig`, `.map`, `.test.ts`, `.test.js`, `.spec.ts`, `.spec.js`, `.test.tsx`, `.test.jsx`, `.spec.tsx`, `.spec.jsx`

**IGNORED_FILES** (17 entries):  
`LICENSE`, `CHANGELOG`, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY.md`, `.gitignore`, `.prettierrc`, `.eslintrc`, `.eslintignore`, `.prettierignore`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `go.sum`, `Cargo.lock`, `Gemfile.lock`, `composer.lock`, `npm-debug.log`, `yarn-debug.log`, `yarn-error.log`, `.env.example`, `.env.template`, `.env.dist`

**PATH_TRAVERSAL_TEMP_FILE:**  
`gcli_secext_path_traversal_test.txt` -- Used for testing path traversal vulnerabilities

#### `src/filesystem.ts` (162 lines)

Git and file system operations:

| Function | Purpose |
|----------|---------|
| `isGitHubRepository()` | Checks if current directory is a GitHub repo via `git remote -v` |
| `getAuditScope(base?, head?)` | Gets git diff (working dir, or between commits, or vs origin/HEAD) |
| `getFilesToAudit()` | Lists relevant files, filtering by constants |
| `getLineCount(files)` | Counts total lines across file list |
| `detectProjectLanguage()` | Detects Node.js/Python/Go/Unknown from CWD files |

#### `src/security.ts` (120 lines)

Line number finding with path traversal protection:

- `findLineNumbers({filePath, snippet})` -- Finds start/end line numbers for a code snippet
- Uses `fs.realpath()` to resolve symlinks
- Validates resolved path is within CWD
- Performs line-by-line matching (trimmed comparison)
- Returns JSON: `{ startLine, endLine }` or `{ error }`

#### `src/parser.ts` (172 lines)

Markdown security report parser:

**Interfaces:**
```typescript
interface Location {
  file: string | null;
  startLine: number | null;
  endLine: number | null;
}

interface Finding {
  vulnerability: string | null;
  vulnerabilityType: string | null;
  severity: string | null;
  dataType: string | null;
  sourceLocation: Location;
  sinkLocation: Location;
  lineContent: string | null;
  description: string | null;
  recommendation: string | null;
  codeSuggestion?: string | null;
}
```

**Key Functions:**
- `parseMarkdownToDict(content)` -- Parses Markdown findings into array of `Finding` objects
- `extractFromSection(section, label)` -- Extracts field value by label using regex
- `parseLocation(locationStr)` -- Parses "path/file.js:10-20" into Location object
- `buildPattern(label)` -- Builds and caches regex for field extraction

**Extracted Fields:** Vulnerability, Vulnerability Type, Severity, Source, Sink, Data, Data Type, Line, Description, Recommendation

#### `src/knowledge.ts` (37 lines)

Knowledge base loader:

```typescript
enum VulnerabilityType {
  ScanDeps = 'scan_deps',
  PathTraversal = 'path_traversal',
  Other = 'other',
}
```

- `loadKnowledge(vulnerability)` -- Loads `.md` file from `knowledge/` directory
- Sanitizes vulnerability name: `replace(/[^a-z0-9_]/gi, '')`
- Returns file content or fallback message
- Used by `security_patch_context` tool

#### `src/poc.ts` (201 lines)

Multi-language PoC execution engine:

**Supported Languages and Execution Strategies:**

| Language | Extension | Setup | Execution |
|----------|-----------|-------|-----------|
| Python | `.py` | Creates `.venv`, installs deps | `.venv/bin/python <file>` |
| Go | `.go` | `go mod init poc`, `go mod tidy` | `go run <file>` |
| TypeScript | `.ts` | None | `npx ts-node <file>` |
| JavaScript | `.js` | None | `node <file>` |

**Security Features:**
- Validates filePath is within POC_DIR
- Creates/deletes path traversal temp file automatically
- Falls back to system site-packages if Python venv missing modules
- Captures stdout/stderr from execution errors

#### `src/knowledge/path_traversal.md` (51 lines)

Knowledge base article for path traversal:

- **Description:** How path traversal works (user data used to construct file paths)
- **Remediation Strategy:** Resolve path, validate with prefix check, reject invalid paths
- **Secure Coding Pattern:** Node.js/TypeScript example using `path.resolve()` + `startsWith()` check
- **Vulnerable vs Secure Comparison:** Side-by-side code examples

### 3.6 Test Suite

| Test File | Target | Lines | Key Tests |
|-----------|--------|-------|-----------|
| `filesystem.test.ts` | filesystem.ts | 116 | GitHub repo detection, file filtering, git diff, line counting |
| `knowledge.test.ts` | knowledge.ts | 66 | Loading valid KB, unknown vuln, error rethrow, path sanitization |
| `knowledge.integration.test.ts` | knowledge.ts | 16 | Loading actual path_traversal.md file |
| `parser.test.ts` | parser.ts | 282 | Standard vuln parsing, code suggestion extraction, complex markdown, privacy violations, multiple findings, edge cases |
| `security.test.ts` | security.ts | 134 | Single-line match, multi-line match, not found, empty snippet, file not found, path traversal (outside CWD), symlink escape |
| `poc.test.ts` | poc.ts | 155 | Node.js execution, Python venv, Go mod init, error handling, path restriction, temp file cleanup |
| `tools/security_patch_context.test.ts` | security_patch_context.ts | 80 | Context generation with KB and file content, file read error handling |

---

## 4. Component 2: Commands

### 4.1 Overview

Commands are TOML files in `commands/security/` that define Gemini CLI custom commands. Each command has a `description` and a `prompt` that instructs the AI model on what to do.

### 4.2 Command: `/security:analyze` (analyze.toml)

**Description:** "Analyzes code changes on your current branch for common security vulnerabilities and privacy violations."

**Scope:** Current branch changes (git diff vs merge base or specified branches)

**Full Workflow Defined in Prompt:**

#### Phase 0: Initial Planning
1. Create `.gemini_security/` folder in workspace
2. Create `SECURITY_ANALYSIS_TODO.md` with initial plan:
   - `- [ ] Define the audit scope.`
   - `- [ ] Conduct a two-pass SAST analysis on all files within scope.`
   - `- [ ] Conduct the final review of all findings...`
3. Create empty `DRAFT_SECURITY_REPORT.md`
4. Prep from `vuln_allowlist.txt` if it exists

#### Phase 1: Dynamic Execution & Planning
1. Read TODO file, execute scope definition
2. Use `get_audit_scope` tool (no args for current changes, or branch names if specified)
3. Provide user list of changed files
4. Rewrite TODO: replace generic analysis task with specific "SAST Recon on [file]" for each file
5. Omit lockfiles (package-lock.json, yarn.lock, go.sum) from plan

#### Phase 2: The Two-Pass Analysis Loop
**Step A: Reconnaissance Pass**
- Scan entire file against SAST Skillset (from GEMINI.md)
- DO NOT perform deep investigations
- If suspicious pattern found, immediately rewrite TODO to add "Investigate" sub-task
- Mark Recon task done when complete

**Step B: Investigation Pass**
- Execute each "Investigate data flow from [variable] on line [line_number]" sub-task
- Trace variable through code (function calls, reassignments, object properties)
- Search for Sink where variable is used
- Analyze Source-to-Sink path for sanitization/validation
- If vulnerability confirmed, append to `DRAFT_SECURITY_REPORT.md`
- Mark investigation done

#### Phase 3: Final Review & Refinement
1. Read entire `DRAFT_SECURITY_REPORT.md`
2. Review every finding against "High-Fidelity Reporting" principles (5-question checklist)
3. Call `find_line_numbers` tool for each finding to get exact line numbers
4. Construct final clean report in memory

#### Phase 4: Final Reporting & Cleanup
1. Output final report to user
2. If no vulns remain, output "clean report" message
3. If `--json` requested, call `convert_report_to_json` tool
4. Remove temporary files (`SECURITY_ANALYSIS_TODO.md`, `DRAFT_SECURITY_REPORT.md`)
5. Keep `security_report.json` if generated
6. **Ask user via `ask_user` tool:**
   a. Which vulnerability to act on (All / VULN-001 / VULN-002 / ...)
   b. What action: Generate PoC OR Patch directly

**MCP Tools Used:**
- `get_audit_scope` (scope definition)
- `find_line_numbers` (final review)
- `convert_report_to_json` (optional JSON output)

### 4.3 Command: `/security:analyze-full` (analyze-full.toml)

**Description:** "Analyzes the entire repository for common security vulnerabilities and privacy violations."

**Scope:** Entire repository (all relevant source files)

**Differences from `/security:analyze`:**

1. **Scope Definition:** Uses `get_files_to_audit` tool (not `get_audit_scope`)
2. **Line Count Check:** After determining file list, calls `get_line_count` tool
   - If total > 20,000 lines, asks user for confirmation before proceeding
   - If user denies, stops analysis
3. **No vuln_allowlist.txt prep** (mentioned in Phase 0)
4. **No post-analysis user questions** about patching/PoC (Phase 4 omits the `ask_user` step)
5. **Same Two-Pass "Recon & Investigate" workflow** as analyze.toml
6. **Same reporting structure** (DRAFT_SECURITY_REPORT.md, find_line_numbers, convert_report_to_json)

**MCP Tools Used:**
- `get_files_to_audit` (scope definition)
- `get_line_count` (line count check)
- `find_line_numbers` (final review)
- `convert_report_to_json` (optional JSON output)

### 4.4 Command: `/security:analyze-github-pr` (analyze-github-pr.toml)

**Description:** "Only to be used with the run-gemini-cli GitHub Action. Analyzes code changes on a GitHub PR for common security vulnerabilities and privacy violations."

**Scope:** GitHub Pull Request changes

**Unique Characteristics:**

1. **Designed for CI/CD:** Only works with `run-gemini-cli` GitHub Action
2. **GitHub MCP Integration:** Uses GitHub MCP server tools:
   - `pull_request_read.get` -- Get PR title, body, metadata
   - `pull_request_read.get_files` -- Get list of added/removed/changed files
   - `pull_request_read.get_diff` -- Get diff with line numbers (LEFT/RIGHT)
3. **Environment Variables:** Expects `$REPOSITORY`, `$PULL_REQUEST_NUMBER`, `$ADDITIONAL_CONTEXT`
4. **GitHub PR Review Submission:**
   - Creates pending PR review via `create_pending_pull_request_review`
   - Adds comments via `add_comment_to_pending_review` with exact template:
     ```
     <COMMENT>
     {{SEVERITY}} {{COMMENT_TEXT}}

     ```suggestion
     {{CODE_SUGGESTION}}
     ```
     </COMMENT>
     ```
   - Submits final review via `submit_pending_pull_request_review` with summary:
     ```
     <SUMMARY>
     ## Security Analysis Summary
     ...
     ## General Feedback
     ...
     </SUMMARY>
     ```
5. **Does NOT ask user about patching/PoC** (automated CI context)
6. **Does NOT clean up files** (no Phase 4 cleanup step)

**MCP Tools Used:**
- `pull_request_read.get` (GitHub MCP)
- `pull_request_read.get_files` (GitHub MCP)
- `pull_request_read.get_diff` (GitHub MCP)
- `find_line_numbers` (security MCP)
- `create_pending_pull_request_review` (GitHub MCP)
- `add_comment_to_pending_review` (GitHub MCP)
- `submit_pending_pull_request_review` (GitHub MCP)

---

## 5. Component 3: Skills

### 5.1 Overview

Skills are directories containing `SKILL.md` files that define operational procedures. They are invoked by the AI model (or the user) to perform specific security operations. Skills can call MCP tools as part of their workflow.

### 5.2 Skill: `security-patcher`

**Location:** `/home/fallen33/security/skills/security-patcher/SKILL.md`  
**Description:** "Invoke this as your absolute first action before using any other tools whenever a user requests to fix, patch, or remediate a vulnerability. Do not perform manual research first."

**Full Workflow (7 Steps):**

1. **Pre-Requisites:**
   - Check for security report in `.gemini_security/`
   - If no report exists, kick off `security:analyze` scan
   - Run existing test suite (`npm test`, `pytest`, `go test ./...`) to establish baseline

2. **Gather Context:**
   - Call `security_patch_context` tool with vulnerability details

3. **Analyze and Prepare Patch:**
   - Analyze file content and knowledge base rules returned from context
   - Apply secure coding patterns from knowledge base
   - Output complete fixed file content or patch for user review

4. **Confirm Verification Intent:**
   - Use `ask_user` tool: "Would you like to verify the patch? (Yes/No)"
   - If No, skip to Step 5

5. **Verify the Vulnerability Exists (Before Patching):**
   - If PoC doesn't exist, use `security:setup_poc` tool to generate one
   - Execute PoC via `run_poc` tool to confirm vulnerability is reproducible

6. **Apply Patch to Target File:**
   - Apply generated patch to the target vulnerable file

7. **Verify the Vulnerability is Fixed (After Patching):**
   - Re-execute PoC via `run_poc` tool
   - Analyze output to confirm vulnerability is fixed
   - Run existing tests to ensure patch didn't break functionality

**MCP Tools Used:**
- `security_patch_context` (context gathering)
- `run_poc` (verification before/after)

### 5.3 Skill: `poc`

**Location:** `/home/fallen33/security/skills/poc/SKILL.md`  
**Description:** "Sets up the necessary workspace, directories, and dependencies to test a vulnerability and generates a Proof-of-Concept."

**Full Workflow (4 Steps):**

1. **Call `poc_context` Tool:**
   - Extract `problemStatement`, `vulnerabilityType`, and `sourceCodeLocation` from context
   - If no exact file path, use search tools to find vulnerable file first
   - Call `poc_context` with these arguments
   - Tool returns JSON: `language`, `pocDir`, `pocFileName`, `extraInstructions`

2. **Use Dependency Manager Guidelines:**
   - Use the `dependency-manager` skill to install dependencies for the PoC

3. **Generate PoC:**
   - Generate standalone script named exactly as `pocFileName` under `pocDir`
   - Follow any `extraInstructions` (e.g., path traversal verification steps)

4. **Run PoC:**
   - Use `run_poc` tool with absolute file path
   - Analyze output to verify vulnerability is reproducible
   - Use `ask_user` tool to ask if user wants to fix it

**MCP Tools Used:**
- `poc_context` (workspace setup)
- `run_poc` (execution)

### 5.4 Skill: `dependency-manager`

**Location:** `/home/fallen33/security/skills/dependency-manager/SKILL.md`  
**Description:** "Safely resolve and install isolated dependencies for isolated sandboxes (PoC execution)."

**Full Workflow (5 Steps):**

1. **Locate and Read Dependency Files:**
   - Walk up from `targetFile` to find closest dependency manifests:
     - TypeScript/Node.js: `package.json`, `package-lock.json`
     - Python: `requirements.txt` or `Pipfile.lock`
     - C++: `conanfile.txt` or `CMakeLists.txt`
     - Go: `go.mod`, `go.sum`
     - Java: `pom.xml` or `build.gradle`/`build.gradle.kts`

2. **Extract Version Constraints:**
   - Read manifests to find exact version constraints for packages used in PoC

3. **Bypass Full Installs (Node.js):**
   - Use `npm_config_cache=.npx_cache` to bypass global proxy auth locks

4. **Write Deterministic Running Script:**
   - Generate standalone script: `install_deps_<target_file_base>.sh` (or `.js`/`.py`)

5. **Trigger Isolated Execute:**
   - Call `install_dependencies` tool with `scriptPath` (absolute path to generated script) and `targetFile`

**MCP Tools Used:**
- `install_dependencies` (isolated execution)

---

## 6. Component 4: GEMINI.md

### 6.1 Overview

**Location:** `/home/fallen33/security/GEMINI.md`  
**Lines:** 244  
**Purpose:** Persistent context/instructions file that provides the Gemini AI model with security analysis guidelines, SAST checklists, severity rubrics, and reporting standards.

### 6.2 Structure

#### Section 1: Persona and Guiding Principles (Lines 7-15)
- Persona: Senior security and privacy engineer
- Core principles:
  - **Selective Action:** Only perform security analysis when explicitly requested
  - **Assume All External Input is Malicious**
  - **Principle of Least Privilege**
  - **Fail Securely**

#### Section 2: Skillset: Permitted Tools & Investigation (Lines 17-29)
- Read-only tools only: `ls -R`, `grep`, `read-file`
- When security query detected, MUST present two options:
  1. **Comprehensive Scan:** Use `/security:analyze` command
  2. **Manual Review:** Manual analysis based on conversation
- Must ask user which they prefer before proceeding
- Must NOT write/modify/delete files unless explicitly instructed
- Artifacts go in `.gemini_security/` directory

#### Section 3: Skillset: SAST Vulnerability Analysis (Lines 30-161)

**Seven vulnerability categories:**

| # | Category | Sub-items |
|---|----------|-----------|
| 1.1 | Hardcoded Secrets | API keys, passwords, private keys, DB connection strings, base64-encoded credentials |
| 1.2 | Broken Access Control | IDOR, Missing Function-Level Access Control, Privilege Escalation, Path Traversal/LFI |
| 1.3 | Insecure Data Handling | Weak crypto (DES, 3DES, RC4, MD5, SHA1), Sensitive data in logs, PII violations, Insecure deserialization |
| 1.4 | Injection Vulnerabilities | SQLi, XSS (dangerouslySetInnerHTML), Command Injection, SSRF, SSTI |
| 1.5 | Authentication | Auth bypass, Weak session tokens, Insecure password reset |
| 1.6 | LLM Safety | Prompt injection, Improper output handling (unsafe execution, injection, flawed security logic), Insecure plugin/tool usage |
| 1.7 | Privacy Violations | Privacy taint analysis: Sources (PII variables) -> Sinks (logging, 3rd-party APIs) |

Each category includes:
- **Action:** What to look for
- **Procedure:** Step-by-step investigation instructions
- **Vulnerable Example:** Code patterns to identify
- **Remediation:** How to fix the issue (for some categories)

#### Section 4: Skillset: Severity Assessment (Lines 163-173)

**Severity Rubric:**

| Severity | Impact | Likelihood | Examples |
|----------|--------|------------|----------|
| **Critical** | RCE, full system compromise, access all data | Straightforward exploit, no special privileges | SQLi -> RCE, hardcoded root creds, auth bypass |
| **High** | Read/modify sensitive data for any user, DoS | May need auth, but reliable exploit | Stored XSS, IDOR on critical data, SSRF |
| **Medium** | Read/modify limited data, impact UX | Requires user interaction, difficult to exploit | Reflected XSS, PII in logs, weak crypto |
| **Low** | Minimal impact, very difficult to exploit | Highly complex, unlikely preconditions | Verbose error messages, limited path traversal |

#### Section 5: Skillset: Reporting (Lines 175-192)

**Finding Format:**
- **ID:** Unique identifier (e.g., `VULN-001`)
- **Vulnerability:** Brief name
- **Vulnerability Type:** "Security" or "Privacy"
- **Severity:** Critical, High, Medium, or Low
- **Source Location:** File path and line numbers
- **Sink Location:** Where sensitive data is exposed (for privacy issues)
- **Data Type:** Kind of PII found (for privacy issues)
- **Line Content:** Complete line of code
- **Description:** Explanation and impact
- **Recommendation:** Remediation suggestion

#### Section 6: Operating Principle: High-Fidelity Reporting (Lines 194-243)

**Five Principles:**
1. **The Principle of Direct Evidence:** Findings must be based on observable evidence in the analyzed code, not speculation about external systems
2. **The Actionability Mandate:** Every finding must be fixable by changing code; no philosophical/architectural issues
3. **Focus on Executable Code:** Do not flag commented-out code, placeholder values, or test files (unless they leak real secrets)
4. **The "So What?" Test:** Perform impact assessment; don't report theoretical issues with no plausible negative impact
5. **Allowlisting Vulnerabilities:** When user disagrees with a finding, MUST use `note-adder` MCP prompt to add to `.gemini_security/vuln_allowlist.txt`

**Five-Question Checklist (Final Review Filter):**
1. Is the vulnerability present in executable, non-test code? (Yes/No)
2. Can I point to the specific line(s) of code that introduce the flaw? (Yes/No)
3. Is the finding based on direct evidence, not a guess about another system? (Yes/No)
4. Can a developer fix this by modifying the code I've identified? (Yes/No)
5. Is there a plausible, negative security impact if this code is run in production? (Yes/No)

> **A vulnerability may only be reported if the answer to ALL five questions is "Yes."**

---

## 7. Integration Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GEMINI CLI                                   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      USER INTERFACE                           │  │
│  │  /security:analyze  |  /security:analyze-full  |  /security:  │  │
│  │  analyze-github-pr                                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                               │                                     │
│                               ▼                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    GEMINI.md (Context)                        │  │
│  │  - SAST Guidelines (7 categories)                             │  │
│  │  - Severity Rubric (Critical/Low)                             │  │
│  │  - Reporting Format (ID, Vulnerability, Severity, etc.)       │  │
│  │  - High-Fidelity Principles (5-question checklist)            │  │
│  │  - Persona & Operating Principles                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                               │                                     │
│          ┌────────────────────┼────────────────────┐               │
│          ▼                    ▼                    ▼               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │
│  │   COMMANDS    │  │    SKILLS     │  │    MCP SERVER         │   │
│  │  (TOML)       │  │  (SKILL.md)   │  │  (Node.js/stdio)      │   │
│  │               │  │               │  │                       │   │
│  │ analyze.toml  │  │security-      │  │ TOOLS (9):            │   │
│  │ analyze-full. │  │patcher        │  │  find_line_numbers    │   │
│  │ toml          │  │poc            │  │  get_audit_scope      │   │
│  │ analyze-      │  │dependency-    │  │  get_files_to_audit   │   │
│  │ github-pr.toml│  │manager        │  │  run_poc              │   │
│  └───────┬───────┘  └───────┬───────┘  │  convert_report_json  │   │
│          │                  │          │  security_patch_ctx   │   │
│          │                  │          │  poc_context          │   │
│          │                  │          │  install_dependencies │   │
│          │                  │          │  get_line_count       │   │
│          ▼                  ▼          │                       │   │
│          └──────────────────┼─────────►│ PROMPTS (2):          │   │
│                             │          │  security:note-adder  │   │
│                             │          │  security:scan_deps   │   │
│                             │          └───────────┬───────────┘   │
│                             │                      │               │
│                             ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              .gemini_security/ (Runtime Artifacts)          │   │
│  │  - SECURITY_ANALYSIS_TODO.md     (task tracking)            │   │
│  │  - DRAFT_SECURITY_REPORT.md      (findings draft)           │   │
│  │  - security_report.json          (JSON report, optional)    │   │
│  │  - vuln_allowlist.txt            (user allowlist)           │   │
│  │  - poc/                          (PoC scripts)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

External Dependencies:
┌───────────────────────────────────────────────────────┐
│  OSV-Scanner MCP Server (dependency scanning)         │
│  - scan_vulnerable_dependencies                       │
│  - get_vulnerability_details                          │
│  - ignore_vulnerability                               │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│  GitHub MCP Server (PR review integration)            │
│  - pull_request_read.get                              │
│  - pull_request_read.get_files                        │
│  - pull_request_read.get_diff                         │
│  - create_pending_pull_request_review                 │
│  - add_comment_to_pending_review                      │
│  - submit_pending_pull_request_review                 │
└───────────────────────────────────────────────────────┘
```

---

## 8. Workflow Maps

### 8.1 User Journey: PR Security Analysis (`/security:analyze`)

```
User Types: /security:analyze

  1. Gemini CLI loads GEMINI.md context
     └── Loads SAST guidelines, severity rubric, reporting format

  2. AI creates workspace
     ├── Creates .gemini_security/ directory
     ├── Creates SECURITY_ANALYSIS_TODO.md with initial plan
     └── Creates empty DRAFT_SECURITY_REPORT.md

  3. Define audit scope
     └── AI calls get_audit_scope MCP tool
         └── Returns git diff of current branch vs merge base

  4. Plan refinement
     └── AI rewrites TODO with "SAST Recon on [file]" for each changed file

  5. Two-Pass Analysis Loop (for each file):
     ├── Pass A: Reconnaissance
     │   └── Scan file against SAST checklist (GEMINI.md)
     │       └── If suspicious pattern found:
     │           └── Add "Investigate data flow from [var] on line [N]" to TODO
     │
     └── Pass B: Investigation
         └── Trace variable from Source to Sink
             └── If vulnerability confirmed:
                 └── Append finding to DRAFT_SECURITY_REPORT.md

  6. Final Review
     ├── Read DRAFT_SECURITY_REPORT.md
     ├── Review against 5-question checklist
     └── Call find_line_numbers for each finding

  7. Report & Cleanup
     ├── Output final report to user
     ├── (Optional) Call convert_report_to_json if --json requested
     ├── Remove SECURITY_ANALYSIS_TODO.md and DRAFT_SECURITY_REPORT.md
     └── Ask user: Which vulnerability to act on? What action (PoC/Patch)?

  8. (Optional) User selects action
     ├── If PoC: Invoke poc skill
     └── If Patch: Invoke security-patcher skill
```

### 8.2 User Journey: Full Repository Analysis (`/security:analyze-full`)

```
User Types: /security:analyze-full

  1. Gemini CLI loads GEMINI.md context

  2. AI creates workspace (same as analyze)

  3. Define audit scope
     └── AI calls get_files_to_audit MCP tool
         └── Returns filtered list of all source files
     └── AI calls get_line_count MCP tool
         └── Returns total lines
         └── If > 20,000: ask user for confirmation
             └── If denied: STOP

  4. Plan refinement
     └── AI rewrites TODO with "SAST Recon on [file]" for each file

  5. Two-Pass Analysis Loop (same as analyze)

  6. Final Review (same as analyze)

  7. Report & Cleanup (same as analyze, but NO ask_user step)
```

### 8.3 User Journey: GitHub PR Analysis (CI/CD)

```
GitHub Event: PR opened OR comment "@gemini-cli /review"

  1. GitHub Action: gemini-review.yml triggered
     ├── Runs "Run Gemini pull request review" step
     └── Runs "Run Gemini security analysis review" step
         └── Prompt: /security:analyze-github-pr
             └── Extensions: [https://github.com/gemini-cli-extensions/security.git]

  2. AI receives context
     ├── $REPOSITORY, $PULL_REQUEST_NUMBER, $ADDITIONAL_CONTEXT

  3. Define audit scope (GitHub-specific)
     └── Call pull_request_read.get_files (GitHub MCP)
     └── Call pull_request_read.get_diff (GitHub MCP)

  4. Two-Pass Analysis Loop (same as analyze)

  5. Final Review (same as analyze)

  6. Submit PR Review (GitHub-specific)
     ├── Call create_pending_pull_request_review (GitHub MCP)
     ├── For each finding: call add_comment_to_pending_review
     │   └── Format: <COMMENT>{{SEVERITY}} {{TEXT}} ```suggestion {{CODE}}```</COMMENT>
     └── Call submit_pending_pull_request_review
         └── Format: Security Analysis Summary + General Feedback
```

### 8.4 User Journey: Security Patching

```
User: "Patch VULN-001"

  1. AI invokes security-patcher skill (MUST be first action)

  2. Pre-Requisites
     ├── Check for .gemini_security/security report
     │   └── If missing: kick off security:analyze
     └── Run existing test suite (baseline)

  3. Gather Context
     └── Call security_patch_context MCP tool
         ├── vulnerability: type (path_traversal, other)
         ├── filePath: target file
         ├── pocFilePath: PoC file (if exists)
         └── vulnerabilityContext: description
         └── Returns: Knowledge Base + File Content + Context

  4. Analyze and Prepare
     ├── Load knowledge base article (path_traversal.md if applicable)
     └── Generate patch/fix

  5. Confirm Verification
     └── Ask user: "Verify patch? (Yes/No)"

  6. Verify Vulnerability Exists (Before)
     ├── If no PoC: call security:setup_poc
     └── Execute PoC via run_poc tool

  7. Apply Patch

  8. Verify Vulnerability is Fixed (After)
     ├── Re-execute PoC via run_poc
     └── Run existing tests
```

### 8.5 User Journey: PoC Generation

```
User: "Generate a PoC for VULN-001"

  1. AI invokes poc skill

  2. Call poc_context MCP tool
     ├── problemStatement: vulnerability description
     ├── vulnerabilityType: path_traversal or other
     └── sourceCodeLocation: file path + line number
     └── Returns: { language, pocDir, pocFileName, extraInstructions }

  3. Use dependency-manager skill
     └── Locate dependency manifests
     └── Generate install script
     └── Call install_dependencies tool

  4. Generate PoC
     └── Write script to pocDir/pocFileName

  5. Run PoC
     └── Call run_poc tool with absolute path
     └── Analyze output
     └── Ask user: "Fix it?"
```

---

## 9. Tool Usage Matrix

### 9.1 Commands -> MCP Tools

| MCP Tool | /security:analyze | /security:analyze-full | /security:analyze-github-pr |
|----------|:-----------------:|:----------------------:|:---------------------------:|
| `get_audit_scope` | Yes | No | No |
| `get_files_to_audit` | No | Yes | No |
| `get_line_count` | No | Yes | No |
| `find_line_numbers` | Yes | Yes | Yes |
| `convert_report_to_json` | Yes (optional) | Yes (optional) | No |
| `security_patch_context` | No (via skill) | No | No |
| `poc_context` | No (via skill) | No | No |
| `run_poc` | No (via skill) | No | No |
| `install_dependencies` | No (via skill) | No | No |
| `security:note-adder` | Yes (allowlist) | No | No |
| `security:scan_deps` | No | No | No |

### 9.2 Commands -> GitHub MCP Tools

| GitHub MCP Tool | /security:analyze | /security:analyze-full | /security:analyze-github-pr |
|-----------------|:-----------------:|:----------------------:|:---------------------------:|
| `pull_request_read.get` | No | No | Yes |
| `pull_request_read.get_files` | No | No | Yes |
| `pull_request_read.get_diff` | No | No | Yes |
| `create_pending_pull_request_review` | No | No | Yes |
| `add_comment_to_pending_review` | No | No | Yes |
| `submit_pending_pull_request_review` | No | No | Yes |

### 9.3 Skills -> MCP Tools

| MCP Tool | security-patcher | poc | dependency-manager |
|----------|:----------------:|:---:|:------------------:|
| `security_patch_context` | Yes | No | No |
| `poc_context` | No | Yes | No |
| `run_poc` | Yes | Yes | No |
| `install_dependencies` | No | No | Yes |

### 9.4 Skills -> Skills

| Invoked Skill | Invoked By |
|---------------|------------|
| `security-patcher` | User request to patch; `/security:analyze` post-analysis prompt |
| `poc` | User request for PoC; `/security:analyze` post-analysis prompt |
| `dependency-manager` | `poc` skill (step 2) |

---

## 10. Complete Inventory

### 10.1 MCP Tools (9 total)

1. **`find_line_numbers`** -- Find line numbers for code snippet in file
2. **`get_audit_scope`** -- Get git diff of changes (current branch or between branches)
3. **`get_files_to_audit`** -- List relevant source files (filtered)
4. **`run_poc`** -- Execute PoC script (Python/Go/TS/JS)
5. **`convert_report_to_json`** -- Convert Markdown report to JSON
6. **`security_patch_context`** -- Fetch vulnerability context + knowledge base
7. **`poc_context`** -- Set up PoC workspace and return coordinates
8. **`install_dependencies`** -- Execute dependency install script in isolated context
9. **`get_line_count`** -- Count total lines across file list

### 10.2 MCP Prompts (2 total)

1. **`security:note-adder`** -- Manage note files (allowlists) in `.gemini_security/`
2. **`security:scan_deps`** -- Orchestrate dependency scanning via OSV-Scanner MCP

### 10.3 Gemini CLI Commands (3 total)

1. **`/security:analyze`** -- Analyze current branch changes for vulnerabilities
2. **`/security:analyze-full`** -- Analyze entire repository for vulnerabilities
3. **`/security:analyze-github-pr`** -- Analyze GitHub PR (CI/CD, posts review comments)

### 10.4 Gemini CLI Skills (3 total)

1. **`security-patcher`** -- Patch vulnerabilities with pre/post verification
2. **`poc`** -- Generate and execute Proof-of-Concept scripts
3. **`dependency-manager`** -- Isolate and install dependencies for PoC execution

### 10.5 Knowledge Base Articles (1 total)

1. **`path_traversal.md`** -- Path traversal remediation guide with secure coding patterns

### 10.6 Internal Modules (6 total)

1. **`constants.ts`** -- Configuration constants (directory names, ignore lists)
2. **`filesystem.ts`** -- Git operations, file discovery, language detection
3. **`security.ts`** -- Line number finding with path traversal protection
4. **`parser.ts`** -- Markdown-to-JSON security report parser
5. **`knowledge.ts`** -- Knowledge base file loader
6. **`poc.ts`** -- Multi-language PoC execution engine

### 10.7 Test Files (7 total)

1. **`filesystem.test.ts`** -- Filesystem module tests (5 tests)
2. **`knowledge.test.ts`** -- Knowledge loader tests (4 tests)
3. **`knowledge.integration.test.ts`** -- Knowledge integration test (1 test)
4. **`parser.test.ts`** -- Report parser tests (10 tests)
5. **`security.test.ts`** -- Line number finder tests (7 tests)
6. **`poc.test.ts`** -- PoC engine tests (5 tests)
7. **`tools/security_patch_context.test.ts`** -- Patch context tests (2 tests)

### 10.8 GitHub Actions Workflows (3 total)

1. **`gemini-review.yml`** -- PR review + security analysis pipeline
2. **`license.yml`** -- License header validation
3. **`package-and-upload-assets.yml`** -- Build, package (multi-platform), and release

### 10.9 Runtime Artifacts (created in `.gemini_security/`)

1. **`SECURITY_ANALYSIS_TODO.md`** -- Dynamic task tracking (created/updated during analysis)
2. **`DRAFT_SECURITY_REPORT.md`** -- Draft findings (created/updated during analysis)
3. **`security_report.json`** -- JSON report (optional, created on --json flag)
4. **`vuln_allowlist.txt`** -- User-managed allowlist (created via note-adder prompt)
5. **`poc/`** -- PoC scripts directory (created by poc_context tool)
6. **`gcli_secext_path_traversal_test.txt`** -- Temp file for path traversal testing (created/deleted by poc.ts)

### 10.10 Vulnerability Types Checked (SAST Categories)

1. Hardcoded Secrets (API keys, passwords, private keys, connection strings)
2. Broken Access Control (IDOR, Missing auth, Privilege escalation, Path traversal/LFI)
3. Insecure Data Handling (Weak crypto, Sensitive data in logs, PII violations, Insecure deserialization)
4. Injection Vulnerabilities (SQLi, XSS, Command Injection, SSRF, SSTI)
5. Authentication (Bypass, Weak tokens, Insecure password reset)
6. LLM Safety (Prompt injection, Improper output handling, Insecure plugin usage)
7. Privacy Violations (PII taint analysis: Sources -> Sinks)

### 10.11 Supported Languages for PoC Execution

1. **Node.js/TypeScript** -- `.ts` via `npx ts-node`, `.js` via `node`
2. **Python** -- `.py` via venv `.venv/bin/python`
3. **Go** -- `.go` via `go run` (with `go mod init` + `go mod tidy`)

### 10.12 Supported Languages for Dependency Management

1. TypeScript/Node.js (package.json)
2. Python (requirements.txt, Pipfile.lock)
3. C++ (conanfile.txt, CMakeLists.txt)
4. Go (go.mod, go.sum)
5. Java (pom.xml, build.gradle)

### 10.13 Complete File Count

| Category | Count |
|----------|-------|
| Source TypeScript files | 13 |
| Test files | 7 |
| Knowledge files | 1 |
| Command files (TOML) | 3 |
| Skill files (SKILL.md) | 3 |
| GitHub workflow files | 3 |
| Documentation files | 5 (README, CHANGELOG, CONTRIBUTING, SECURITY, docs/releases) |
| Configuration files | 5 (package.json, tsconfig.json, gemini-extension.json, .gitignore, .release-please-manifest.json) |
| License/Legal | 1 (LICENSE) |
| **Total non-git files** | **41** |

---

## Appendix A: Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| 0.5.0 | 2026-04-01 | Added PoC skill, security patching as skill+tool combo, JSON report output, Python/Go PoC support |
| 0.4.0 | 2025-12-17 | Added basic PoC command, privacy taxonomy, audit scope tooling, OSV-Scanner integration |
| 0.3.0 | 2025-10-20 | Added `.gemini_security/` folder, GitHub PR analysis command, GHA workflows, security preamble |
| 0.2.0 | 2025-10-07 | Initial template migration |

## Appendix B: External Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| `@modelcontextprotocol/sdk` | MCP protocol implementation | ^1.24.0 |
| `zod` | Runtime type validation | ^3.25.76 |
| `vitest` | Test framework | ^3.2.4 |
| `typescript` | TypeScript compiler | ^5.0.0 |
| `@types/node` | Node.js type definitions | ^24.5.2 |
| `osv-scanner` (external) | Dependency vulnerability scanning | v2.2.4 (pinned) |
| `github-mcp-server` (external) | GitHub API access for PR reviews | v0.18.0 |

## Appendix C: Key File Paths Summary

| File | Absolute Path |
|------|---------------|
| GEMINI.md (persistent context) | `/home/fallen33/security/GEMINI.md` |
| Extension manifest | `/home/fallen33/security/gemini-extension.json` |
| MCP Server entry | `/home/fallen33/security/mcp-server/src/index.ts` |
| Command: analyze | `/home/fallen33/security/commands/security/analyze.toml` |
| Command: analyze-full | `/home/fallen33/security/commands/security/analyze-full.toml` |
| Command: analyze-github-pr | `/home/fallen33/security/commands/security/analyze-github-pr.toml` |
| Skill: security-patcher | `/home/fallen33/security/skills/security-patcher/SKILL.md` |
| Skill: poc | `/home/fallen33/security/skills/poc/SKILL.md` |
| Skill: dependency-manager | `/home/fallen33/security/skills/dependency-manager/SKILL.md` |
| Knowledge: path traversal | `/home/fallen33/security/mcp-server/src/knowledge/path_traversal.md` |
| GHA: gemini-review | `/home/fallen33/security/.github/workflows/gemini-review.yml` |
</task_result>