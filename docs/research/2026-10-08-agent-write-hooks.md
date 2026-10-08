# Agent write-time hooks

Research record, 2026-10-08. Discussion material, not an ADR, an accepted design, or qualification evidence. External docs and first-party source were read on this date. No hook was installed and no agent was run.

## Purpose

A repository can ask each agent to run `pnpm refs fix <file>` when that agent writes or edits a file. This record checks the current primary documentation for Claude Code, the OpenAI Codex CLI, and Cursor: the project config file, the event name, how the file path arrives, whether a shell command is supported, and whether a matcher can limit the hook to file writes. None of the three documents the hook as absent.

`.agents/skills/handoff/agents/openai.yaml` is Codex skill metadata. The customization guide says a skill declares an MCP dependency there. It is not a lifecycle hook. [Customization](https://developers.openai.com/codex/concepts/customization)

## Claude Code

Project hooks that can be committed live in `.claude/settings.json`. User hooks live in `~/.claude/settings.json` and are not shared. [Hooks reference, hook locations](https://code.claude.com/docs/en/hooks)

The event after a successful tool call is `PostToolUse`. It matches on the tool name. The documented file-edit matcher is `Edit|Write`, which is an exact match of either tool name. A matcher made only of letters, digits, `_`, `-`, spaces, commas, and `|` is a list of exact names; `Edit|Write` does not also match `NotebookEdit`. A pattern with any other character is an unanchored JavaScript regular expression, and the reference says `Edit.*` matches both `Edit` and `NotebookEdit`. [Hooks reference, matcher patterns](https://code.claude.com/docs/en/hooks)

A handler can narrow further with `if`, using one permission rule such as `Edit(*.ts)`. The reference says the field holds exactly one rule, so Edit and Write each need their own handler. `if` is evaluated on tool events, including `PostToolUse`. [Hooks reference, hook handler fields](https://code.claude.com/docs/en/hooks)

A command hook has `"type": "command"`. With no `args`, the `command` string is shell form: `sh -c` on macOS and Linux. The event JSON arrives on stdin. For `Write`, `Edit`, and `Read`, `tool_input.file_path` is absolute. The same absolute path is what `PostToolUse` receives. The reference's `Write` example also puts the path on `tool_response.filePath`. There is no documented environment variable that carries the edited path. [Hooks reference, command hooks and PostToolUse](https://code.claude.com/docs/en/hooks)

The hooks guide's formatter, added to `.claude/settings.json`, is the documented post-edit command:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

[Automate actions with hooks](https://code.claude.com/docs/en/hooks-guide)

`PostToolUse` with `Edit|Write` does not run when a `Bash` command, or a process outside Claude Code, rewrites the file. `FileChanged` does, but its matcher is a list of literal filenames to watch, not a general write event. A hook that rewrites a watched file runs again. [Hooks reference, PostToolUse and FileChanged](https://code.claude.com/docs/en/hooks)

## Codex

Project hooks live in `<repo>/.codex/hooks.json`, or as inline `[hooks]` tables in `<repo>/.codex/config.toml`. User copies are `~/.codex/hooks.json` and `~/.codex/config.toml`. One layer should use one of the two forms; if both exist, Codex merges them and warns. Project-local hooks load only when the project `.codex/` layer is trusted. A non-managed command hook does not run until its exact definition is reviewed and trusted, through `/hooks` in the CLI. Hooks are enabled by default; `features.hooks = false` turns them off. [Hooks](https://developers.openai.com/codex/hooks)

The event after a supported tool produces output is `PostToolUse`. File edits go through `apply_patch`. That tool has `PreToolUse` and `PostToolUse`. The matcher is a regular expression against `tool_name` and the aliases `apply_patch`, `Edit`, and `Write`. The hook input still reports `tool_name` as `apply_patch`. The docs list `Edit|Write` and `^apply_patch$` as matcher examples. Hosted tools such as `WebSearch` do not use this path. The page says tool hooks are a guardrail, not a complete enforcement boundary. Shell commands match as `Bash`, not as `apply_patch`. [Hooks, tool coverage and PostToolUse](https://developers.openai.com/codex/hooks)

Every command hook receives one JSON object on stdin. For `apply_patch`, the documented tool input is `tool_input.command`, not a `file_path` field. `cwd` is a separate common field. The page's example of a hook after Codex writes or edits files is an MCP tool hook, and it passes the patch through as `${tool_input.command}`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "mcp_tool",
            "server": "scanner",
            "tool": "scan_patch",
            "input": { "patch": "${tool_input.command}" }
          }
        ]
      }
    ]
  }
}
```

A shell command uses the same event and matcher, with `"type": "command"` and a `command` string. Commands run with the session `cwd`. The docs prefer a git-root path over a relative `.codex/hooks/...` path, because Codex may be started from a subdirectory. Only `command` and `mcp_tool` handlers run; `prompt` and `agent` are parsed and skipped. [Hooks, config shape and MCP tool hooks](https://developers.openai.com/codex/hooks)

Current Codex source puts that command string together as `{ "command": <raw patch text> }` for `PostToolUse`. The patch grammar in the same tree names each file on its own line: `*** Add File: `, `*** Delete File: `, `*** Update File: `, and an optional `*** Move to: `. A patch has one or more hunks, so one event can name several files. The parser accepts relative and absolute paths. [apply_patch.rs at `be2e129ecd67d900c016eda12d5d193e33d9c3da`](https://github.com/openai/codex/blob/be2e129ecd67d900c016eda12d5d193e33d9c3da/codex-rs/core/src/tools/handlers/apply_patch.rs), [parser.rs at the same commit](https://github.com/openai/codex/blob/be2e129ecd67d900c016eda12d5d193e33d9c3da/codex-rs/apply-patch/src/parser.rs)

The `${tool_input.file_path}` text in the hooks page is an illustration of placeholder expansion for an imagined event. It is not the `apply_patch` input schema. [Hooks, expand arguments](https://developers.openai.com/codex/hooks)

## Cursor

Project hooks live in `.cursor/hooks.json` at the repository root. User hooks live in `~/.cursor/hooks.json`. Project hooks run in a trusted workspace, from the project root, and can be committed. Cloud agents load the project file and run `afterFileEdit`. [Hooks](https://cursor.com/docs/hooks)

The event after the Agent edits a file is `afterFileEdit`. The docs describe it as the place for formatters or accounting of agent-written code. It applies to Cmd+K and Agent Chat. Tab completions use the separate event `afterTabFileEdit`. The `afterFileEdit` matcher is tested against the fixed value `Write`; an empty string or `*` matches everything. It is not a filter over tool names such as `Edit` versus `Write`. [Hooks, matchers and afterFileEdit](https://cursor.com/docs/hooks)

The input is JSON on stdin. The event-specific fields are `file_path`, an absolute path, and `edits`, an array of `old_string` and `new_string`. Common fields include `hook_event_name` and `workspace_roots`. The path is not an environment variable and not a command argument unless the command reads it from that JSON. [Hooks, common schema and afterFileEdit](https://cursor.com/docs/hooks)

`command` can be a shell string, an absolute path, or a relative path. The documented project formatter is:

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [{ "command": ".cursor/hooks/format.sh" }]
  }
}
```

`version` is required and is `1`. The quickstart script reads stdin and exits 0. [Hooks, project hooks](https://cursor.com/docs/hooks)

`postToolUse` is a second, generic event after any successful tool. Its matcher filters tool type, and the documented values include `Write`. The published `postToolUse` input example is a Shell call (`tool_name`, `tool_input`, `tool_output`), not a file-edit payload. `afterFileEdit` is the event whose schema carries `file_path`. [Hooks, postToolUse](https://cursor.com/docs/hooks)

## Git pre-commit in these docs

The Claude Code hooks guide and hooks reference, the Codex hooks page, and the Cursor hooks page, as fetched on this date, do not discuss a git pre-commit hook.

The Codex customization guide does, beside `AGENTS.md` rather than beside lifecycle hooks. It says to pair `AGENTS.md` with infrastructure that enforces those rules, and names pre-commit hooks, linters, and type checkers. The same page's next-step list says to add pre-commit hooks and linters so Codex follows repo conventions. [Customization](https://developers.openai.com/codex/concepts/customization)

## What this repo can configure

All three can run a command after a file write or edit. The shapes below follow the documented command hooks. They are not installed in this repo.

**Claude Code**, `.claude/settings.json`. `PostToolUse`, matcher `Edit|Write`. The command reads `tool_input.file_path` from stdin JSON. This uses the guide's formatter shape with `pnpm refs fix`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm refs fix \"$(jq -r '.tool_input.file_path')\""
          }
        ]
      }
    ]
  }
}
```

That matcher does not cover `NotebookEdit`, and it does not cover a file rewritten by `Bash`.

**Codex**, `<repo>/.codex/hooks.json`. `PostToolUse`, matcher `Edit|Write` (or `apply_patch`). The command can be a shell command. Stdin has the patch in `tool_input.command`, not one file-path field. A command that calls `pnpm refs fix` once per file has to parse the `*** Add File:`, `*** Update File:`, `*** Delete File:`, and `*** Move to:` lines. The documented command shape, pointed at a repo script, is:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$(git rev-parse --show-toplevel)/.codex/hooks/refs-fix.sh\""
          }
        ]
      }
    ]
  }
}
```

The project `.codex/` layer has to be trusted, and the hook definition has to be trusted, before that command runs. Shell edits that do not go through `apply_patch` are `Bash` events.

**Cursor**, `.cursor/hooks.json`. `afterFileEdit`. Stdin JSON field `file_path`. The documented command shape is a script path run from the repo root:

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [{ "command": ".cursor/hooks/refs-fix.sh" }]
  }
}
```

The script reads `file_path` from stdin and passes it to `pnpm refs fix`. `command` may instead be a shell string. This event is the Agent edit hook. Tab edits are `afterTabFileEdit`. The workspace must be trusted.

No agent among the three has no such hook.

## Sources

- [Claude Code hooks reference](https://code.claude.com/docs/en/hooks), fetched 2026-10-08
- [Claude Code hooks guide](https://code.claude.com/docs/en/hooks-guide), fetched 2026-10-08
- [Codex hooks](https://developers.openai.com/codex/hooks), fetched 2026-10-08 as `hooks.md`
- [Codex customization](https://developers.openai.com/codex/concepts/customization), fetched 2026-10-08
- [openai/codex `apply_patch.rs`](https://github.com/openai/codex/blob/be2e129ecd67d900c016eda12d5d193e33d9c3da/codex-rs/core/src/tools/handlers/apply_patch.rs) and [`parser.rs`](https://github.com/openai/codex/blob/be2e129ecd67d900c016eda12d5d193e33d9c3da/codex-rs/apply-patch/src/parser.rs), commit `be2e129ecd67d900c016eda12d5d193e33d9c3da` (main on 2026-10-08)
- [Cursor hooks](https://cursor.com/docs/hooks), fetched 2026-10-08
