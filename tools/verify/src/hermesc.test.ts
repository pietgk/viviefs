// The build steps' Hermes compiler: native everywhere hermes-compiler ships a
// binary for, emulated on Linux arm64, and a clear stop when it cannot run.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterEach, describe, expect, it } from '@effect/vitest'
import { findQemu, linuxHermesc, planHermesc, writeWrapper } from './hermesc.ts'
import { ROOT } from './stages.ts'

const base = {
  platform: 'linux',
  arch: 'arm64',
  override: undefined,
  qemu: '/usr/bin/qemu-x86_64-static',
  hermesc: '/repo/node_modules/hermes-compiler/hermesc/linux64-bin/hermesc',
  dir: '/repo/.artifacts/verify/hermesc',
}

const scratch: string[] = []
const scratchDir = () => {
  const dir = mkdtempSync(join(tmpdir(), 'viviefs-hermesc-'))
  scratch.push(dir)
  return dir
}
afterEach(() => {
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('planHermesc', () => {
  it('runs the shipped binary where there is one', () => {
    expect(planHermesc({ ...base, arch: 'x64' })).toEqual({ _tag: 'Native' })
    expect(planHermesc({ ...base, platform: 'darwin' })).toEqual({ _tag: 'Native' })
  })

  it('leaves an override that is already set alone', () => {
    expect(planHermesc({ ...base, override: '/opt/hermes' })).toEqual({ _tag: 'Native' })
  })

  it('emulates the x86-64 binary on Linux arm64', () => {
    expect(planHermesc(base)).toEqual({
      _tag: 'Emulated',
      dir: base.dir,
      script: `#!/bin/sh\nexec "${base.qemu}" "${base.hermesc}" "$@"\n`,
    })
  })

  it('stops with what to install when no emulator is found', () => {
    const plan = planHermesc({ ...base, qemu: undefined })
    expect(plan._tag).toBe('Missing')
    expect(plan._tag === 'Missing' && plan.message).toContain('sudo apt-get install qemu-user-static')
  })
})

describe('findQemu', () => {
  it('finds the first emulator on PATH', () => {
    const empty = scratchDir()
    const bin = scratchDir()
    writeFileSync(join(bin, 'qemu-x86_64'), '')
    expect(findQemu([empty, bin].join(delimiter))).toBe(join(bin, 'qemu-x86_64'))
    expect(findQemu(empty)).toBeUndefined()
    expect(findQemu(undefined)).toBeUndefined()
  })
})

describe('linuxHermesc', () => {
  it('resolves the binary hermes-compiler ships for the evidence app', () => {
    const path = linuxHermesc(join(ROOT, 'apps/evidence-client'))
    expect(path).toMatch(/hermes-compiler[/\\]hermesc[/\\]linux64-bin[/\\]hermesc$/)
    expect(statSync(path).isFile()).toBe(true)
  })
})

describe('writeWrapper', () => {
  it('writes an executable wrapper where Expo looks for it', () => {
    const dir = join(scratchDir(), 'hermesc')
    const bin = scratchDir()
    writeFileSync(join(bin, 'echo-args'), '#!/bin/sh\necho "$@"\n', { mode: 0o755 })
    const override = writeWrapper({
      _tag: 'Emulated',
      dir,
      script: `#!/bin/sh\nexec "${join(bin, 'echo-args')}" hermesc "$@"\n`,
    })
    expect(override).toBe(dir)
    const wrapper = join(dir, 'build', 'bin', 'hermesc')
    expect(readFileSync(wrapper, 'utf8')).toContain('echo-args')
    expect(execFileSync(wrapper, ['-version'], { encoding: 'utf8' })).toBe('hermesc -version\n')
    mkdirSync(join(dir, 'build', 'bin'), { recursive: true })
    expect(writeWrapper({ _tag: 'Emulated', dir, script: '#!/bin/sh\n' })).toBe(dir)
  })
})
