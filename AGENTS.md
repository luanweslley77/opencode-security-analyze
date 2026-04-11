# AGENTS.md — security-opencode

OpenCode security plugin. Ports the Gemini CLI `@security` extension (MCP server + skills + commands) into native OpenCode plugin format.

## Commands

```bash
npm run typecheck   # tsc --noEmit
npm run build       # bun run scripts/build.ts (outputs to dist/)
```

No test runner is configured yet.

## Architecture

**Entry point:** `index.ts` → re-exports `SecurityPlugin` from `plugin/src/index.js`.

The plugin registers:
- **12 native tools** under the `tool` hook (each defined in `plugin/src/tools/*.ts`)
- **`config`** hook — defines `agent["security"]` + 5 slash commands
- **`tool.execute.before`** — blocks reading of `.env` files
- **`permission.ask`** — auto-denies `rm -rf /` patterns
- **`shell.env`** — sets `SECURITY_ANALYSIS_MODE=enabled`
- **`event`** — logs `session.idle` events

### Source layout

| File | Responsibility |
|------|---------------|
| `index.ts` | Root entry — imports and re-exports `SecurityPlugin` |
| `plugin/src/index.ts` | Plugin entry, hooks orchestration, agent + command config |
| `plugin/src/constants.ts` | Directory names, ignore lists, shared `execFileAsync` |
| `plugin/src/filesystem.ts` | Git ops: `getAuditScope`, `getFilesToAudit` (with non-git fallback), `getLineCount` |
| `plugin/src/security.ts` | `findLineNumbers` with path traversal protection (`realpath` + prefix check) |
| `plugin/src/parser.ts` | `parseMarkdownToDict` — converts Markdown security reports to JSON findings |
| `plugin/src/knowledge.ts` | `loadKnowledge` — loads `.md` files from `plugin/src/knowledge/` directory |
| `plugin/src/poc.ts` | Multi-language PoC execution engine (Python venv, Go mod, ts-node, node) |
| `plugin/src/tools/*.ts` | Individual tool definitions (each exports one `tool()`) |
| `plugin/src/knowledge/path_traversal.md` | Knowledge base article for path traversal remediation |

### Companion files (not part of the plugin build)

| Path | Purpose |
|------|---------|
| `commands/*.md` | OpenCode custom commands (`/security-analyze`, `/security-analyze-full`, `/security-analyze-pr`) |
| `skills/*/SKILL.md` | Agent skills (`security-patcher`, `dependency-manager`, `poc`) |
| `osv-scanner/*` | Bundled osv-scanner v2.3.5 binaries (6 platforms: linux/darwin/windows x amd64/arm64, ~318MB total) |

## Key conventions

- **ESM only** — `"type": "module"` in package.json. Use `.js` extensions in imports (e.g. `./constants.js`).
- **All imports use `.js` suffix** even for `.ts` files — this is required by ESM + TypeScript `moduleResolution: "bundler"`.
- **Knowledge files** live in `plugin/src/knowledge/` — `loadKnowledge()` resolves relative to its own `__dirname`. After `tsc` build they end up in `dist/knowledge/`.
- **No `require()`** — use `import` / `fs.promises` throughout.
- **Security directory** is `.opencode_security/` (not `.gemini_security/` which the original MCP used).

## Development Workflow

**Current phase:** Active development — porting `/home/fallen33/security` (Gemini CLI extension) to OpenCode plugin format.

### Testing workflow

**Manual testing:**
1. Build the plugin: `npm run build`
2. Copy to test project: `cp dist/security.ts ~/testing/.opencode/plugins/security.ts`
3. Open OpenCode: `cd ~/testing && opencode`
4. Execute security commands and observe behavior
5. Check `.opencode_security/` for generated reports

**E2E test reports** (stored in `test-results/`):
- `test-results/opencode/` — OpenCode CLI test results (5 commands)
- `test-results/gemini/` — Gemini CLI test results (5 commands)

### Package distribution (current — git install)
The plugin is installed via git reference in `opencode.json`:
```json
{
  "plugin": ["opencode-security-analyze@git+https://github.com/luanweslley77/opencode-security-analyze.git#dev"]
}
```

The `package.json` `files` field points to **source files** (`index.ts`, `plugin/src`, `osv-scanner`, `skills`, `commands`, `scripts`, `tsconfig.json`), not `dist/`. This allows git installs to work without requiring a pre-built `dist/` directory.

### Release checklist — when switching to `main` branch + npm publish

Before creating a `main` branch or publishing to npm, the following changes must be made to `package.json`:

1. **Switch entrypoint from source to build:**
   ```diff
   - "main": "./index.ts",
   - "exports": { ".": "./index.ts" },
   + "main": "./dist/security.ts",
   + "types": "./dist/security.d.ts",
   + "exports": { ".": "./dist/security.ts" },
   ```

2. **Switch `files` from source to build artifacts:**
   ```diff
     "files": [
   -   "index.ts",
   -   "osv-scanner",
   -   "plugin/src",
   -   "skills",
   -   "commands",
   -   "scripts",
   -   "tsconfig.json"
   +   "dist",
   +   "osv-scanner",
   +   "skills",
   +   "commands"
     ],
   ```

3. **Add `dist/security.ts` to `.gitignore`** (it's already built locally, but the git `files` field will include it for npm publish)

4. **Run `npm run build`** to generate `dist/security.ts` before publish

## Reference docs

- `MCP_SERVER_MAPPING.md` — complete mapping of the original Gemini CLI MCP server (9 tools, 2 prompts)
- `OPENCODE_PLUGIN_API.md` — complete OpenCode plugin API reference (all hooks, events, SDK methods)

## Origin

Ported from `/home/fallen33/security` (Gemini CLI security extension, Apache 2.0, Google LLC).
