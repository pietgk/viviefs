// The three agents pass a written path differently. The expected paths are
// the ones in the event, not a second parse of it.
import { describe, expect, it } from '@effect/vitest'
import { AGENT_HOOKS, agentHookProblems, hookPaths, isHookAgent, parseHookEvent } from './hook.ts'

const CLAUDE = {
  tool_input: { file_path: '/repo/docs/adr/0099-the-presenter-pattern.md' },
}

const CURSOR = {
  file_path: '/repo/FIXTURE.md',
  edits: [{ old_string: 'D107', new_string: 'D107' }],
}

const CODEX_PATCH = [
  '*** Update File: docs/adr/0099-the-presenter-pattern.md',
  '@@',
  ' D107',
  '*** Add File: FIXTURE.md',
  '*** Delete File: gone.md',
  '*** Update File: docs/adr/old.md',
  '*** Move to: docs/adr/0098-origin-trust.md',
].join('\n')

describe('agent write hooks', () => {
  it('reads the file Claude Code and Cursor put on the event', () => {
    expect(hookPaths('claude', CLAUDE)).toEqual(['/repo/docs/adr/0099-the-presenter-pattern.md'])
    expect(hookPaths('cursor', CURSOR)).toEqual(['/repo/FIXTURE.md'])
    expect(hookPaths('claude', { tool_input: {} })).toEqual([])
    expect(hookPaths('cursor', {})).toEqual([])
  })

  it('reads every file a Codex patch adds, updates or moves, and skips a delete', () => {
    expect(hookPaths('codex', { tool_input: { command: CODEX_PATCH } })).toEqual([
      'docs/adr/0099-the-presenter-pattern.md',
      'FIXTURE.md',
      'docs/adr/old.md',
      'docs/adr/0098-origin-trust.md',
    ])
    expect(hookPaths('codex', { tool_input: { command: '*** Delete File: gone.md\n' } })).toEqual([])
    expect(hookPaths('codex', { tool_input: {} })).toEqual([])
    expect(isHookAgent('claude')).toBe(true)
    expect(isHookAgent('edit')).toBe(false)
  })

  it('ignores an event that is not JSON', () => {
    expect(parseHookEvent('')).toBeUndefined()
    expect(parseHookEvent('not json')).toBeUndefined()
    expect(parseHookEvent(JSON.stringify(CLAUDE))).toEqual(CLAUDE)
  })

  it('fails when a supported agent config does not call its hook command', () => {
    const missing = agentHookProblems(() => undefined)
    expect(missing).toEqual([
      '.claude/settings.json: Claude Code has no write-time hook calling `pnpm refs hook claude`',
      '.codex/hooks.json: Codex has no write-time hook calling `pnpm refs hook codex`',
      '.cursor/hooks.json: Cursor has no write-time hook calling `pnpm refs hook cursor`',
    ])
    const present = Object.fromEntries(AGENT_HOOKS.map(({ path, command }) => [path, `{ "command": "${command}" }`]))
    expect(agentHookProblems((path) => present[path])).toEqual([])
    expect(agentHookProblems((path) => (path === '.cursor/hooks.json' ? '{ "command": "prettier" }' : present[path]))).toEqual([
      '.cursor/hooks.json: Cursor must call `pnpm refs hook cursor`',
    ])
  })
})
