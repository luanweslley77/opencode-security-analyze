---
name: e2e-test-interactive
description: Runs end-to-end interactive tests for the security plugin on both OpenCode and Gemini CLI. Executes all 5 commands in sequence and documents each phase in markdown files.
license: Apache-2.0
compatibility: opencode
metadata:
  audience: developers
  workflow: testing
---

You are a QA engineer testing the security plugin end-to-end.

## Test Plan

### OpenCode Tests (5 commands)

For each command:
1. `cd ~/testing && opencode`
2. Start a new session
3. Execute the slash command
4. Wait for the agent to complete all work
5. Capture the full interaction
6. Save to `~/security-opencode/test-results/opencode/<command>.md`
7. Exit opencode before the next test

Commands to test:
- `/security-analyze`
- `/security-analyze-full`
- `/security-analyze-pr`
- `/security-scan-deps`
- `/security-note`

### Gemini CLI Tests (5 commands)

For each command:
1. `cd ~/testing && gemini`
2. Press `Ctrl+Y` to activate yolo mode
3. Execute the slash command
4. Wait for the agent to complete all work
5. Capture the full interaction
6. Save to `~/security-opencode/test-results/gemini/<command>.md`
7. Exit gemini before the next test

Commands to test:
- `/security:analyze`
- `/security:analyze-full`
- `/security:analyze-github-pr`
- `/security:scan-deps`
- `security:note-adder`

### Documentation Format

Each `.md` file should contain:
```markdown
# <Command Name> - <Platform> Test

## Environment
- Platform: OpenCode / Gemini CLI
- Project: ~/testing
- Timestamp: <date>

## Command Executed
```
/<command> [arguments]
```

## Interaction Log

### Phase 1: Command Invocation
<agent output when command is triggered>

### Phase 2: Tool Calls
<all tool invocations with inputs and outputs>

### Phase 3: Analysis / Execution
<main work being done>

### Phase 4: Final Report
<final output from agent>

### Phase 5: Cleanup
<temporary file cleanup confirmation>

## Result
- Status: SUCCESS / FAILED / TIMEOUT
- Vulnerabilities Found: <count>
- Errors: <any errors encountered>
- Notes: <observations>
```

## Execution Order

Run tests in this order:
1. OpenCode: `/security-analyze`
2. OpenCode: `/security-scan-deps`
3. OpenCode: `/security-note`
4. OpenCode: `/security-analyze-full`
5. OpenCode: `/security-analyze-pr`
6. Gemini: `/security:analyze`
7. Gemini: `/security:scan-deps`
8. Gemini: `security:note-adder`
9. Gemini: `/security:analyze-full`
10. Gemini: `/security:analyze-github-pr`

## Important Notes

- Always wait for the agent to complete before capturing output
- Use `wait-idle` for TUI interactions (opencode and gemini are TUIs)
- Use `capture --annotate` to see what's happening in the TUI
- If a command takes too long (> 5 min), mark it as TIMEOUT and move to the next
- Clean up any `.opencode_security/` files between tests if needed
- For `/security-analyze-pr` and `/security:analyze-github-pr`: these require a GitHub PR context, so test gracefully (agent should handle gracefully or skip)
