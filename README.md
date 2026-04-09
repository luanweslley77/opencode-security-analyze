# OpenCode Security Plugin

Port of the [Gemini CLI Security Extension](https://github.com/gemini-cli-extensions/security) for OpenCode.

## Features

- **AI-powered security analysis**: Leverages advanced capabilities to provide intelligent and context-aware security analysis
- **Focused analysis**: Specifically designed to analyze code changes within pull requests
- **Dependency scans**: Identifies known vulnerabilities affecting your project's dependencies
- **Proof of Concept generation**: Generate and execute PoC scripts to verify vulnerabilities
- **Automated patching**: Fix vulnerabilities with security best practices

## Components

### Plugin (Tools)

Native OpenCode tools for security analysis:

- `security_analyze` - Initialize security analysis workspace
- `get_audit_scope` - Get git diff of current changes
- `get_files_to_audit` - List relevant files for auditing
- `get_line_count` - Count total lines of code
- `find_line_numbers` - Find line numbers of code snippets
- `convert_report_to_json` - Convert Markdown report to JSON
- `security_patch_context` - Get context for patching a vulnerability
- `poc_context` - Setup workspace for Proof of Concept
- `run_poc` - Execute a PoC script
- `install_dependencies` - Install dependencies in isolated context

### Commands

Custom commands for security analysis:

- `/security-analyze` - Analyze code changes on current branch for vulnerabilities
- `/security-analyze-full` - Analyze entire repository for vulnerabilities
- `/security-analyze-pr` - Analyze code changes on a PR for vulnerabilities

### Skills

Reusable agent skills:

- `security-patcher` - Patch security vulnerabilities with verification
- `dependency-manager` - Manage isolated dependencies for PoC execution
- `poc` - Generate and execute Proof of Concept scripts

## Installation

### Option 1: Copy to project

Copy the files to your project:

```bash
# Copy plugin
mkdir -p .opencode/plugins
cp plugin/src/index.ts .opencode/plugins/security.ts

# Copy skills
cp -r skills/* .opencode/skills/

# Copy commands
mkdir -p .opencode/commands
cp commands/* .opencode/commands/
```

### Option 2: Install via npm (when published)

```bash
npm install @opencode-ai/plugin-security
```

Then add to your `opencode.json`:

```json
{
  "plugin": ["@opencode-ai/plugin-security"]
}
```

## Usage

### Analyze current branch changes

```
/security-analyze
```

### Analyze entire repository

```
/security-analyze-full
```

### Analyze a specific PR

```
/security-analyze-pr main feature-branch
```

### Customize analysis scope

```
/security-analyze Analyze only the src/ directory
```

### Get JSON output

After analysis, request JSON format:

```
Convert the report to JSON
```

Or use the tool directly:

```
convert_report_to_json
```

## Types of Vulnerabilities Scanned

### Secrets management
- Hardcoded secrets (API keys, passwords, connection strings)

### Insecure data handling
- Weak cryptographic algorithms (DES, RC4, ECB mode)
- Logging of sensitive information
- PII handling violations
- Insecure deserialization

### Injection vulnerabilities
- Cross-site scripting (XSS)
- SQL injection (SQLi)
- Command injection
- Server-side request forgery (SSRF)
- Server-side template injection (SSTI)

### Authentication
- Authentication bypass
- Weak or predictable session tokens
- Insecure password reset

### LLM Safety
- Insecure Prompt Handling (Prompt Injection)
- Improper Output Handling
- Insecure Plugin and Tool Usage

## Workflow

The security analysis follows a **Two-Pass "Recon & Investigate" Workflow**:

1. **Reconnaissance Pass**: Fast scan to identify all potential sources of untrusted input
2. **Investigation Pass**: Deep-dive analysis to trace data flow from source to sink

This ensures full coverage without missing vulnerabilities.

## Directory Structure

After analysis, a `.opencode_security/` directory is created:

```
.opencode_security/
├── SECURITY_ANALYSIS_TODO.md    # Task tracking
├── DRAFT_SECURITY_REPORT.md     # Working report
├── security_report.json         # Final JSON report (if requested)
└── poc/                         # Proof of Concept scripts
```

## Benchmark

The original Gemini CLI Security Extension achieved:
- **Precision**: 90%
- **Recall**: 93%

Tested against the [OpenSSF CVE Benchmark](https://github.com/ossf-cve-benchmark/ossf-cve-benchmark) dataset.

## License

Apache-2.0 (same as the original Gemini CLI Security Extension)

## Credits

Based on the [Gemini CLI Security Extension](https://github.com/gemini-cli-extensions/security) by Google.
