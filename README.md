# OpenCode Security Plugin

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-Plugin-purple.svg)](https://opencode.ai)
[![Node.js >=18](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org)

SAST security analysis plugin for [OpenCode](https://opencode.ai). Ported from the [Gemini CLI Security Extension](https://github.com/gemini-cli-extensions/security) by Google.

Provides 12 native tools, 5 slash commands, 3 reusable skills, and a dedicated security agent for comprehensive vulnerability detection, dependency scanning, PoC generation, and automated patching.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Agent Assignment](#agent-assignment)
- [Tools Reference](#tools-reference)
- [Security Agent](#security-agent)
- [Skills](#skills)
- [Two-Pass Workflow](#two-pass-workflow)
- [High-Fidelity Reporting](#high-fidelity-reporting)
- [Security Hooks](#security-hooks)
- [Knowledge Base](#knowledge-base)
- [Plugin Scope Detection](#plugin-scope-detection)
- [Directory Structure](#directory-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Credits](#credits)

---

## Overview

This plugin transforms OpenCode into a **security analysis engine** capable of performing static application security testing (SAST) on your codebase. It follows a rigorous **Two-Pass "Recon & Investigate" workflow** that separates broad vulnerability scanning from deep data-flow tracing, ensuring both coverage and accuracy.

### What it does

| Capability | Description |
|------------|-------------|
| **SAST Scanning** | Analyzes source code for 7 categories of vulnerabilities including SQL injection, XSS, command injection, SSRF, SSTI, broken access control, and more |
| **Dependency Scanning** | Uses [osv-scanner](https://github.com/google/osv-scanner) v2.3.5 (bundled binary) to identify known CVEs in project dependencies |
| **PoC Generation & Execution** | Creates and runs proof-of-concept scripts in isolated sandboxes (Python venv, Go mod, ts-node, Node.js) to verify vulnerabilities exist |
| **Automated Patching** | Generates secure code fixes with before/after PoC verification to confirm the vulnerability is fixed |
| **Privacy Violation Detection** | Traces sensitive data (passwords, SSNs, PII) from source to sink, flagging improper handling |

### Origin

Ported from the [Gemini CLI Security Extension](https://github.com/gemini-cli-extensions/security) (Apache 2.0, Google LLC). The original extension achieved **90% precision** and **93% recall** when tested against the [OpenSSF CVE Benchmark](https://github.com/ossf-cve-benchmark/ossf-cve-benchmark) dataset.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        OpenCode TUI                             |
│                                                                 |
│  /security-analyze  /security-scan-deps  /security-note         |
│        │                   │                   │                |
│        ▼                   ▼                   ▼                |
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Security Agent                         |  |
│  │  SAST Checklist • Remediation Patterns • Severity Rubric  |  |
│  │  High-Fidelity Reporting Checklist • Core Principles      |  |
│  └───────────────────────────────────────────────────────────┘  │
│        │                                                        |
│        ▼                                                        |
│  ┌───────────────────────────────────────────────────────────┐  |
│  │                   Plugin Tools (12)                       |  | 
│  │  security_analyze • get_audit_scope • get_files_to_audit  |  |
│  │  get_line_count • find_line_numbers • convert_report_*    |  |
│  │  security_patch_context • poc_context • run_poc           |  |
│  │  install_dependencies • security_scan_deps • note_adder   |  |
│  └───────────────────────────────────────────────────────────┘  │
│        │                                                        |
│        ▼                                                        |
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Security Hooks (4)                     |  |
│  │  .env block • rm -rf / deny • SECURITY_ANALYSIS_MODE env  |  |
│  │  session.idle logging                                     |  | 
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 | 
│  Skills: security-patcher • poc • dependency-manager            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation

### Option 1: Git Install (Recommended)

Add to your project's `opencode.json`:

```jsonc
{
  "plugin": [
    "opencode-security-analyze@git+https://github.com/luanweslley77/opencode-security-analyze.git#dev"
  ]
}
```

OpenCode will install the plugin automatically at startup.

### Option 2: Local Copy

Copy the plugin files directly to your project:

```bash
# Copy plugin
mkdir -p .opencode/plugins
cp dist/security.ts .opencode/plugins/security.ts

# Register in opencode.json
# (no additional config needed — OpenCode auto-discovers .opencode/plugins/*.ts)
```

### Option 3: npm Install (Future)

```bash
npm install @opencode-ai/plugin-security
```

Then add to `opencode.json`:

```json
{
  "plugin": ["@opencode-ai/plugin-security"]
}
```

### Skills Auto-Copy

The plugin automatically copies bundled skills to the correct location on startup:

| Installation Type | Skills Destination |
|-------------------|-------------------|
| **Local** (project-level) | `<project>/.opencode/skills/` |
| **Global** (`~/.config/opencode/`) | `~/.config/opencode/skills/` |

Scope detection uses OpenCode's `plugin_origins` API (via the `config` hook) with a path-based fallback heuristic. No manual skill setup is required.

---

## Quick Start

1. **Install** the plugin using any method above
2. **Open** OpenCode in your project directory
3. **Run** a security command:

```
/security-analyze          # Scan current branch changes
/security-scan-deps        # Scan dependencies for known CVEs
/security-note             # Manage vulnerability allowlists
```

4. **Review** the generated report in `.opencode_security/DRAFT_SECURITY_REPORT.md`

---

## Commands

### `/security-analyze`

**Purpose:** Scan code changes on the current git branch for security vulnerabilities.

**Scope:** Uses `git diff` to identify modified files (current branch or merge-base with `origin/HEAD`).

**When to use:** After making code changes, before committing. Quick targeted analysis.

**Example:**
```
/security-analyze
```

**Agent:** `security` (dedicated security agent with SAST checklist and remediation patterns)

**Workflow:**
1. Calls `security_analyze` to initialize workspace
2. Calls `get_audit_scope` to get changed files
3. Performs Two-Pass analysis on each changed file
4. Generates report with findings

---

### `/security-analyze-full`

**Purpose:** Scan the entire repository for security vulnerabilities and privacy violations.

**Scope:** All relevant source files (excluding node_modules, tests, lockfiles, assets, etc.).

**When to use:** Initial security audit of a new project, or periodic comprehensive review.

**Example:**
```
/security-analyze-full
```

**Agent:** `security`

**Workflow:**
1. Calls `security_analyze` to initialize workspace
2. Calls `get_files_to_audit` to list all scannable files
3. Calls `get_line_count` — warns if >20,000 LOC
4. Performs Two-Pass analysis on every file
5. Generates comprehensive report

---

### `/security-analyze-pr`

**Purpose:** Scan code changes between two git branches (e.g., PR comparison).

**Scope:** `git diff` between specified branches.

**When to use:** Reviewing a pull request for security issues before merge.

**Example:**
```
/security-analyze-pr main feature-branch
```

**Agent:** `security`

**Workflow:**
1. Calls `security_analyze` to initialize workspace
2. Calls `get_audit_scope` with branch arguments
3. Performs Two-Pass analysis on PR diff
4. Generates report with PR-specific findings

---

### `/security-scan-deps`

**Purpose:** Scan project dependencies for known CVEs using the OSV database.

**Scope:** All lockfiles (`package-lock.json`, `yarn.lock`, `go.sum`, etc.) recursively.

**When to use:** After adding/updating dependencies, or as part of CI/CD.

**Example:**
```
/security-scan-deps
```

**Agent:** `security`

**Workflow:**
1. Calls `security_scan_deps` (uses bundled osv-scanner v2.3.5 binary)
2. Scans all lockfiles recursively
3. Classifies findings by CVSS severity (CRITICAL > HIGH > MEDIUM > LOW)
4. Provides prioritized patching recommendations
5. **Does NOT auto-update dependencies** — only recommends

---

### `/security-note`

**Purpose:** Manage security notes and vulnerability allowlists.

**When to use:** Document accepted risks, false positives, or security decisions.

**Example:**
```
/security-note
```

**Agent:** `security`

**Modes:**
- `create` — Create a new note (fails if it already exists)
- `append` — Add to existing note (or create if missing)
- `overwrite` — Replace entire note contents

---

### Agent Assignment

All 5 security commands automatically use the dedicated `security` agent. This means every command invocation includes:

- **SAST Vulnerability Analysis** — 7-category checklist covering injection, access control, data handling, authentication, LLM safety, and privacy violations
- **Secure Coding Patterns** — Remediation examples for path traversal, SQLi, XSS, command injection, SSRF, weak crypto, hardcoded secrets, and prompt injection (Node.js, Python, Go)
- **Severity Assessment Rubric** — Critical/High/Medium/Low classification with impact descriptions
- **High-Fidelity Reporting Checklist** — 5-question verification to minimize false positives

This happens automatically — no additional configuration is needed. When you run `/security-analyze`, `/security-scan-deps`, or any other security command, the full security context is loaded into the agent's system prompt.

---

## Tools Reference

All 12 tools are registered via the `tool` hook and available to any agent with permission.

### Analysis Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `security_analyze` | Initializes `.opencode_security/` workspace with TODO tracker and draft report | None |
| `get_audit_scope` | Returns git diff of current changes, optionally comparing two branches | `base?` (string), `head?` (string) |
| `get_files_to_audit` | Lists all relevant source files, filtering out noise (node_modules, tests, lockfiles, assets) | None |
| `get_line_count` | Counts total lines of code across a file list | `files` (string[]) |
| `find_line_numbers` | Finds start/end line numbers of a code snippet in a file (with path traversal protection via `realpath` + prefix check) | `filePath` (string), `snippet` (string) |
| `convert_report_to_json` | Converts Markdown security report to `security_report.json` in `.opencode_security/` | None |

### Patching & PoC Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `security_patch_context` | Fetches knowledge base rules + file content context before patching a vulnerability | `vulnerability` (enum: 10 types), `filePath`, `pocFilePath`, `vulnerabilityContext` |
| `poc_context` | Sets up PoC workspace, detects project language, returns coordinates for PoC generation | `problemStatement`, `vulnerabilityType` (path_traversal\|other), `sourceCodeLocation` |
| `run_poc` | Executes a PoC script from the `poc/` directory. Supports Python (venv), Go (mod), TypeScript (ts-node), Node.js. Path-traversal protected. | `filePath` (string) |
| `install_dependencies` | Runs dependency installation in an isolated context, walking up to find project root | `scriptPath`, `targetFile`, `cwd?` |

### Dependency & Note Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `security_scan_deps` | Scans dependencies for known CVEs via osv-scanner v2 CLI (bundled binary, multi-platform) | `path?` (string), `format?` (text\|json) |
| `security_note_adder` | Creates/appends/overwrites security notes in `.opencode_security/notes/` | `note_name`, `content`, `mode?` (append\|create\|overwrite) |

---

## Security Agent

All security commands use a dedicated `security` agent with a comprehensive system prompt. The agent provides:

### SAST Vulnerability Analysis (7 Categories)

1. **Hardcoded Secrets** — API keys, passwords, connection strings, private keys
2. **Broken Access Control** — IDOR, missing function-level access control, privilege escalation, path traversal/LFI
3. **Insecure Data Handling** — Weak cryptography (DES, RC4, MD5), sensitive info logging, PII violations, insecure deserialization
4. **Injection Vulnerabilities** — SQLi, XSS, command injection, SSRF, SSTI
5. **Authentication** — Bypass, weak tokens, insecure password reset
6. **LLM Safety** — Prompt injection, improper output handling, insecure plugin usage
7. **Privacy Violations** — Source-to-sink tracing of sensitive data (passwords, SSNs, PII)

### Secure Coding Patterns

The agent includes remediation code examples for:

- **Path Traversal** — `path.resolve()` + `startsWith()` validation (Node.js, Python)
- **SQL Injection** — Parameterized queries (mysql2, Prisma, sqlite3, SQLAlchemy)
- **XSS** — React auto-escape, DOMPurify, EJS, Jinja2
- **Command Injection** — `execFile`/`spawn` with argument arrays (Node.js, Python, Go)
- **SSRF** — Domain allowlists + internal IP blocking (Node.js, Python)
- **Weak Cryptography** — AES-256-GCM, bcrypt, Fernet (Node.js, Python)
- **Hardcoded Secrets** — Environment variables, AWS Secrets Manager (Node.js, Python)
- **LLM Prompt Injection** — XML delimiter pattern, escape functions (Node.js, Python)

### Severity Assessment

| Severity | Impact | Examples |
|----------|--------|----------|
| **Critical** | RCE, full system compromise, access to all sensitive data | SQLi → RCE, hardcoded root credentials, auth bypass |
| **High** | Read/modify sensitive data, significant DoS | Stored XSS, IDOR on critical data, SSRF |
| **Medium** | Limited data access, impact user experience | Reflected XSS, PII in logs, weak crypto |
| **Low** | Minimal impact, difficult to exploit | Verbose error messages, limited path traversal |

---

## Skills

Three reusable skills are auto-installed with the plugin. Each skill is an `SKILL.md` file that the agent loads on demand.

### `security-patcher`

**Trigger:** User requests to fix, patch, or remediate a vulnerability.

**Workflow (7 steps):**
1. **Pre-Requisites** — Check for security report, run `security_analyze` if missing, execute test suite
2. **Gather Context** — Call `security_patch_context` tool with vulnerability type, file path, and context
3. **Analyze & Prepare** — Apply secure coding patterns from knowledge base
4. **Confirm Verification** — Ask user if they want PoC verification (Yes/No)
5. **Pre-Patch Verification** — Generate and run PoC via `run_poc` to confirm vulnerability exists
6. **Apply Patch** — Write secure fix to target file
7. **Post-Patch Verification** — Re-run PoC to confirm vulnerability is fixed, run test suite

---

### `poc`

**Trigger:** User requests to generate a proof-of-concept for a vulnerability.

**Workflow (4 steps):**
1. Call `poc_context` tool with problem statement, vulnerability type, and source code location
2. Use `dependency-manager` skill to install required dependencies
3. Generate PoC script in the returned `pocDir` with `pocFileName`
4. Run PoC with `run_poc`, verify reproducibility, ask if user wants to fix

**Supported Languages:**
- **Python** — Creates venv, installs deps from `pyproject.toml`/`requirements.txt`, runs with venv Python
- **Go** — Initializes `go.mod` if missing, runs `go mod tidy`, runs `go run`
- **TypeScript** — Uses `npx ts-node` with isolated npm cache
- **Node.js** — Direct `node` execution

---

### `dependency-manager`

**Trigger:** Isolated dependency installation for PoC sandboxes.

**Workflow (5 steps):**
1. Locate and read dependency files (`package.json`, `requirements.txt`, `go.mod`, `pom.xml`, etc.)
2. Extract exact version constraints for packages used in the PoC
3. Bypass full installs (Node.js: `npm_config_cache=.npx_cache`)
4. Write deterministic running script (`install_deps_<target_file_base>.sh`)
5. Call `install_dependencies` tool with the script path and target file

---

## Two-Pass Workflow

All analysis commands follow the **Two-Pass "Recon & Investigate" Workflow**, which separates broad scanning from deep investigation:

### Phase 0: Initial Planning
1. Create `.opencode_security/` directory
2. Write `SECURITY_ANALYSIS_TODO.md` with high-level objectives
3. Create empty `DRAFT_SECURITY_REPORT.md`
4. Check `.opencode_security/vuln_allowlist.txt` for accepted risks

### Phase 1: Dynamic Execution & Planning
1. Define audit scope (git diff, full repo, or PR diff)
2. Rewrite TODO with specific **"SAST Recon on [file]"** tasks for each file
3. Exclude lockfiles and dependency management files from the plan

### Phase 2: The Two-Pass Analysis Loop

#### Step A — Reconnaissance Pass
- Scan the entire file against the SAST checklist
- **Do not investigate deeply** — just flag potential issues
- For each finding, add an **"Investigate data flow from [variable] on line [N]"** sub-task
- Mark Recon task as done when complete

#### Step B — Investigation Pass
- Trace each flagged variable through function calls, reassignments, and object properties
- Search for a **sink** where the variable (or a derivative) is used unsafely
- Analyze the code path between source and sink for sanitization/validation
- If confirmed, append the finding to `DRAFT_SECURITY_REPORT.md`
- Mark investigation as done

### Phase 3: Final Review & Refinement
1. Read the entire `DRAFT_SECURITY_REPORT.md`
2. Review every finding against the **5-question High-Fidelity Checklist**
3. Use `find_line_numbers` to add exact start/end lines
4. Construct the final clean report

### Phase 4: Final Reporting & Cleanup
1. Output the reviewed report to the user
2. If no vulnerabilities remain, output "No vulnerabilities found"
3. If JSON was requested, call `convert_report_to_json`
4. Remove temporary files (`SECURITY_ANALYSIS_TODO.md`, `DRAFT_SECURITY_REPORT.md`)

### Example TODO Evolution

```markdown
# Initial
- [ ] Define the audit scope.
- [ ] Conduct a two-pass SAST analysis on all files within scope.
- [ ] Final review and generate report.

# After Phase 1 (scope defined)
- [x] Define the audit scope. (3 files: user.ts, files.ts, database.ts)
- [ ] SAST Recon on src/routes/user.ts.
- [ ] SAST Recon on src/routes/files.ts.
- [ ] SAST Recon on src/db/database.ts.
- [ ] Final review and generate report.

# During Recon Pass (user.ts)
- [x] SAST Recon on src/routes/user.ts.
  - [ ] Investigate data flow from userId (req.params.id) on line 8.
  - [ ] Investigate data flow from role (req.body.role) on line 20.
  - [ ] Investigate data flow from email, password on lines 26-27.
- [ ] SAST Recon on src/routes/files.ts.
...

# After Investigation Pass
- [x] Investigate data flow from userId (req.params.id) on line 8.
  → Confirmed: SQL Injection via getUserById() string concatenation
  → Confirmed: IDOR — no ownership check on user data access
```

---

## High-Fidelity Reporting

Before any vulnerability is reported, it must pass all **five questions** of the checklist:

1. **Is the vulnerability present in executable, non-test code?**
2. **Can I point to the specific line(s) of code that introduce the flaw?**
3. **Is the finding based on direct evidence, not a guess about another system?**
4. **Can a developer fix this by modifying the code I've identified?**
5. **Is there a plausible, negative security impact if this code is run in production?**

A vulnerability may **only** be reported if the answer to **ALL five** questions is "Yes." This minimizes false positives and ensures every finding is actionable.

---

## Security Hooks

The plugin registers 4 hooks that provide baseline security protections:

| Hook | Trigger | Behavior |
|------|---------|----------|
| `tool.execute.before` | Before `read` tool executes | **Blocks** reading of any file with `.env` in the path. Throws: `"Access to .env files is blocked by security policy"` |
| `permission.ask` | Before bash permission is granted | **Auto-denies** any command matching `rm -rf /` pattern. Sets `output.status = "deny"` |
| `shell.env` | When shell session is created | Injects `SECURITY_ANALYSIS_MODE=enabled` environment variable |
| `event` | On `session.idle` event | Logs `"Security analysis session completed"` via the OpenCode API |

---

## Knowledge Base

The plugin includes a knowledge base with remediation patterns for 10 vulnerability types, loaded via `security_patch_context`:

| Type | Key Remediation |
|------|----------------|
| `path_traversal` | `path.resolve()` + `startsWith()` prefix check |
| `sqli` | Parameterized queries (`?` placeholders), ORMs |
| `xss` | Framework auto-escaping, DOMPurify for innerHTML |
| `cmd_injection` | `execFile`/`spawn` with argument arrays |
| `ssrf` | Domain allowlists, internal IP blocking (10.x, 172.16.x, 192.168.x) |
| `weak_crypto` | AES-256-GCM for encryption, bcrypt/Argon2 for passwords |
| `hardcoded_secrets` | Environment variables, secret managers (AWS, Vault) |
| `llm_injection` | XML delimiters, escape `<`, `>`, `"` in user input |
| `scan_deps` | OSV scanner usage, CVSS-based prioritization |
| `other` | OWASP Top 10, CWE references, NIST guidelines |

---

## Plugin Scope Detection

The plugin detects whether it was installed **globally** or **locally** and routes skills accordingly:

### Detection Method

1. **Primary:** Reads `plugin_origins` from OpenCode's config (via the `config` hook). This field contains `scope: "global" | "local"` for each installed plugin.
2. **Fallback:** If `plugin_origins` is unavailable, compares the plugin's `__dirname` against the project `directory` — if the plugin lives inside the project tree, it's local; otherwise global.

### Skill Routing

| Scope | Skills Destination |
|-------|-------------------|
| `local` | `<project>/.opencode/skills/` |
| `global` | `~/.config/opencode/skills/` |

This ensures skills are available regardless of installation method (git install, npm, local copy, or global plugin directory).

---

## Directory Structure

### Plugin Source

```
security-opencode/
├── index.ts                          # Root entry — re-exports SecurityPlugin
├── package.json                      # Package metadata
├── tsconfig.json                     # TypeScript configuration
├── scripts/
│   └── build.ts                      # Bundler — concatenates all source files
├── plugin/src/
│   ├── index.ts                      # Plugin entry — hooks, tools, agent, commands
│   ├── constants.ts                  # Shared constants (IGNORED_*, execFileAsync)
│   ├── filesystem.ts                 # Git ops, file discovery, non-git fallback
│   ├── security.ts                   # findLineNumbers with path traversal protection
│   ├── parser.ts                     # parseMarkdownToDict — MD → JSON
│   ├── knowledge.ts                  # Inline knowledge base (remediation patterns)
│   ├── poc.ts                        # Multi-language PoC execution engine
│   └── tools/
│       ├── security_analyze.ts       # Initialize analysis workspace
│       ├── get_audit_scope.ts        # Git diff tool
│       ├── get_files_to_audit.ts     # File discovery with non-git fallback
│       ├── get_line_count.ts         # Line counter
│       ├── find_line_numbers.ts      # Snippet → line numbers
│       ├── convert_report_to_json.ts # MD → JSON converter
│       ├── security_patch_context.ts # Knowledge base + file context for patching
│       ├── poc_context.ts            # PoC workspace setup
│       ├── run_poc.ts                # PoC executor (Python/Go/TS/Node)
│       ├── install_dependencies.ts   # Isolated dependency installation
│       ├── security_scan_deps.ts     # osv-scanner v2 wrapper (bundled binary)
│       └── security_note_adder.ts    # Note/allowlist manager
├── skills/
│   ├── security-patcher/SKILL.md     # Patching workflow
│   ├── poc/SKILL.md                  # PoC generation workflow
│   └── dependency-manager/SKILL.md   # Isolated dependency management
├── commands/                         # Markdown command files (optional)
├── osv-scanner/                      # Bundled osv-scanner v2.3.5 binaries (multi-platform)
│   ├── osv-scanner_linux_amd64
│   ├── osv-scanner_linux_arm64
│   ├── osv-scanner_darwin_amd64
│   ├── osv-scanner_darwin_arm64
│   ├── osv-scanner_windows_amd64.exe
│   └── osv-scanner_windows_arm64.exe
├── dist/
│   ├── security.ts                   # Bundled plugin (single file, ~85KB)
│   └── knowledge/                    # Knowledge base files (post-build)
└── test-results/                     # E2E test reports
    ├── opencode/                     # OpenCode test results
    └── gemini/                       # Gemini CLI test results
```

### Project After Analysis

```
your-project/
├── .opencode_security/
│   ├── SECURITY_ANALYSIS_TODO.md    # Task tracking (auto-cleaned)
│   ├── DRAFT_SECURITY_REPORT.md     # Working report (auto-cleaned)
│   ├── security_report.json         # Final JSON (if requested)
│   ├── notes/
│   │   └── vuln_allowlist.txt       # Accepted risks / false positives
│   └── poc/                         # Proof-of-concept scripts
│       ├── poc_file_1.py            # Python PoC
│       ├── poc_file_2.go            # Go PoC
│       └── poc_file_3.ts            # TypeScript PoC
└── .opencode/
    └── skills/                      # Auto-copied skills (local install)
        ├── security-patcher/SKILL.md
        ├── poc/SKILL.md
        └── dependency-manager/SKILL.md
```

---

## Development

### Prerequisites

- Node.js >= 18
- bun (for building)
- TypeScript >= 5.5

### Setup

```bash
npm install
```

### Commands

```bash
npm run typecheck   # tsc --noEmit — type checking
npm run build       # bun run scripts/build.ts — bundle to dist/security.ts
npm run test        # No tests configured — see test-results/ for E2E reports
```

### Build Output

The build script concatenates all source files into a single bundled file at `dist/security.ts`:
- Strips relative imports (all code is inlined)
- Removes `export` keywords from internal declarations
- Preserves final `export { SecurityPlugin }` and `export default { id: "security", server: SecurityPlugin }`

---

## Troubleshooting

### `fatal: not a git repository` during analysis

**Cause:** The project is not a git repository.

**Resolution:** The plugin handles this gracefully with a non-git fallback that walks the filesystem directly. You may see the git error message but analysis will continue. If no files are found, explicitly tell the agent which files/directories to scan.

### `SECURITY_DIR is not defined`

**Cause:** Outdated plugin build. The `SECURITY_DIR` constant was moved to `constants.ts`.

**Resolution:** Rebuild and redeploy the plugin:
```bash
npm run build
cp dist/security.ts <your-plugin-location>/security.ts
```

### `execFileAsync is not defined`

**Cause:** The build script was stripping the `execFileAsync` declaration along with local definitions.

**Resolution:** Update to the latest version of the plugin (commit `b2e32af` or later) where `execFileAsync` is defined in `constants.ts` and imported by all tool files.

### No vulnerabilities found but I know there are some

**Cause:** Possible false negative from the Two-Pass workflow or allowlist filtering.

**Resolution:**
1. Check `.opencode_security/vuln_allowlist.txt` — the vulnerability may be allowlisted
2. Re-run with `/security-analyze-full` for a comprehensive scan
3. Explicitly ask the agent to investigate a specific file or line range

### Skills not appearing in OpenCode

**Cause:** Skills were not auto-copied or the scope detection failed.

**Resolution:** Manually copy skills to the correct location:
```bash
# For local installs:
cp -r skills/* <project>/.opencode/skills/

# For global installs:
cp -r skills/* ~/.config/opencode/skills/
```

---

## License

Apache-2.0 — same as the original Gemini CLI Security Extension.

---

## Credits

Based on the [Gemini CLI Security Extension](https://github.com/gemini-cli-extensions/security) by Google LLC.

Original extension license: Apache-2.0

This port adapts the following components from the original:
- SAST vulnerability analysis methodology
- Two-Pass "Recon & Investigate" workflow
- High-Fidelity Reporting checklist
- Secure coding pattern examples
- Skills architecture (security-patcher, poc, dependency-manager)

### Author

**Luan Weslley** <luanweslley77@gmail.com>

[Repository](https://github.com/luanweslley77/opencode-security-analyze) · [Issues](https://github.com/luanweslley77/opencode-security-analyze/issues)
