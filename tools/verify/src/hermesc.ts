/**
 * The Hermes compiler for the `build` and `bundle-size` steps.
 *
 * `expo export` compiles Hermes bytecode with the `hermesc` that the
 * `hermes-compiler` package ships, which has Linux binaries for x86-64 only.
 * On Linux arm64 (the cloud sandboxes) `verify` runs that same binary under
 * QEMU user-mode emulation, through `REACT_NATIVE_OVERRIDE_HERMES_DIR`, the
 * override Expo checks first (`@expo/metro-config` `exportHermes.js`). The
 * bytecode is the same, so bundle sizes still compare with the baseline.
 */
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { delimiter, dirname, join } from 'node:path'

/** The override Expo reads; it runs `<dir>/build/bin/hermesc`. */
export const OVERRIDE = 'REACT_NATIVE_OVERRIDE_HERMES_DIR'

/** QEMU user-mode emulators for x86-64, in the order they are tried. */
export const QEMU = ['qemu-x86_64-static', 'qemu-x86_64'] as const

export type HermescPlan =
  | { readonly _tag: 'Native' }
  | { readonly _tag: 'Emulated'; readonly dir: string; readonly script: string }
  | { readonly _tag: 'Missing'; readonly message: string }

/** What the build steps need on this machine; pure. */
export const planHermesc = (input: {
  readonly platform: string
  readonly arch: string
  readonly override: string | undefined
  readonly qemu: string | undefined
  readonly hermesc: string
  readonly dir: string
}): HermescPlan => {
  if (input.override || input.platform !== 'linux' || input.arch !== 'arm64') return { _tag: 'Native' }
  if (!input.qemu) {
    return {
      _tag: 'Missing',
      message:
        'The build steps compile Hermes bytecode, and hermes-compiler ships Linux binaries for x86-64 only.\n' +
        `On Linux arm64, verify runs it under QEMU user-mode emulation: install ${QEMU[0]} ` +
        '(`sudo apt-get install qemu-user-static`), or set ' +
        `${OVERRIDE} to a directory with build/bin/hermesc.\n`,
    }
  }
  return {
    _tag: 'Emulated',
    dir: input.dir,
    script: `#!/bin/sh\nexec ${JSON.stringify(input.qemu)} ${JSON.stringify(input.hermesc)} "$@"\n`,
  }
}

/** The first emulator on `PATH`, or undefined. */
export const findQemu = (path: string | undefined): string | undefined =>
  (path ?? '')
    .split(delimiter)
    .filter((entry) => entry !== '')
    .flatMap((entry) => QEMU.map((name) => join(entry, name)))
    .find((candidate) => existsSync(candidate))

/** The Linux `hermesc` that `react-native` in `app` resolves, as Expo finds it. */
export const linuxHermesc = (app: string): string => {
  const reactNative = dirname(createRequire(join(app, 'package.json')).resolve('react-native/package.json'))
  const compiler = dirname(createRequire(join(reactNative, 'package.json')).resolve('hermes-compiler/package.json'))
  return join(compiler, 'hermesc', 'linux64-bin', 'hermesc')
}

/** Writes the emulating wrapper where the override expects it, and returns the override. */
export const writeWrapper = (plan: Extract<HermescPlan, { _tag: 'Emulated' }>): string => {
  const bin = join(plan.dir, 'build', 'bin')
  mkdirSync(bin, { recursive: true })
  const wrapper = join(bin, 'hermesc')
  writeFileSync(wrapper, plan.script)
  chmodSync(wrapper, 0o755)
  return plan.dir
}
