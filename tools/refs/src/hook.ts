/**
 * How each agent hands a written file to `pnpm refs` (D86').
 * Event shapes: docs/research/2026-10-08-agent-write-hooks.md.
 */
export const HOOK_COMMAND = 'pnpm refs hook'

export const AGENT_HOOKS = [
  { agent: 'Claude Code', path: '.claude/settings.json', command: `${HOOK_COMMAND} claude` },
  { agent: 'Codex', path: '.codex/hooks.json', command: `${HOOK_COMMAND} codex` },
  { agent: 'Cursor', path: '.cursor/hooks.json', command: `${HOOK_COMMAND} cursor` },
] as const

export const HOOK_AGENTS = ['claude', 'codex', 'cursor'] as const

export type HookAgent = (typeof HOOK_AGENTS)[number]

export const isHookAgent = (agent: string): agent is HookAgent =>
  (HOOK_AGENTS as ReadonlyArray<string>).includes(agent)

/** Every supported agent config calls the same command. */
export const agentHookProblems = (read: (path: string) => string | undefined): ReadonlyArray<string> =>
  AGENT_HOOKS.flatMap(({ agent, path, command }) => {
    const source = read(path)
    if (source === undefined) return [`${path}: ${agent} has no write-time hook calling \`${command}\``]
    if (!source.includes(command)) return [`${path}: ${agent} must call \`${command}\``]
    return []
  })

const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined

const stringField = (value: unknown, key: string): string | undefined => {
  const field = record(value)?.[key]
  return typeof field === 'string' && field !== '' ? field : undefined
}

export const parseHookEvent = (raw: string): unknown => {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

/** Claude Code PostToolUse: `tool_input.file_path` is absolute. */
export const claudePath = (event: unknown): string | undefined => stringField(record(event)?.tool_input, 'file_path')

/** Cursor afterFileEdit: `file_path` is absolute. */
export const cursorPath = (event: unknown): string | undefined => stringField(event, 'file_path')

/**
 * Codex apply_patch: `tool_input.command` is the patch. One event can name
 * several files. A deleted file is not rewritten.
 */
export const codexPaths = (event: unknown): ReadonlyArray<string> => {
  const patch = stringField(record(event)?.tool_input, 'command')
  if (patch === undefined) return []
  return [...patch.matchAll(/^\*\*\* (?:Add File|Update File|Move to):[ \t]*(.+)$/gm)]
    .map((match) => match[1]?.trim() ?? '')
    .filter((path) => path !== '')
}

export const hookPaths = (agent: HookAgent, event: unknown): ReadonlyArray<string> => {
  if (agent === 'claude') {
    const path = claudePath(event)
    return path === undefined ? [] : [path]
  }
  if (agent === 'cursor') {
    const path = cursorPath(event)
    return path === undefined ? [] : [path]
  }
  return codexPaths(event)
}
