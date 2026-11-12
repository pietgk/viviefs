import { describe, expect } from '@effect/vitest'
import { FUTURE_SKEW_MS } from '@viviefs/datom'
import { exercise, note } from '@viviefs/testing/exercise'
import * as Effect from 'effect/Effect'
import * as problem from './problem/receive.ts'
import * as solution from './solution/receive.ts'

const NOW = 1_700_000_000_000

describe('02.02 receive', () => {
  exercise({
    id: '02.02',
    problem,
    solution,
    check: (impl: typeof solution) =>
      Effect.gen(function* () {
        // Times are shown in ms from NOW, so the log reads the same on every run.
        const at = ({ pt, c }: { pt: number; c: number }) => `(${pt - NOW >= 0 ? '+' : ''}${pt - NOW}, ${c})`
        const said = (result: ReturnType<typeof impl.receive>) => (result._tag === 'ok' ? `clock ${at(result.last)}` : `refused, more than ${result.boundMs} ms ahead`)
        const last = { pt: NOW, c: 2 }
        const steps = [
          { name: 'a first remote tx becomes the clock', clock: null, remote: last, expected: { _tag: 'ok', last } },
          { name: 'a remote tx behind changes nothing', clock: last, remote: { pt: NOW - 10, c: 9 }, expected: { _tag: 'ok', last } },
          { name: 'a remote tx ahead moves the clock up', clock: last, remote: { pt: NOW + 2_000, c: 0 }, expected: { _tag: 'ok', last: { pt: NOW + 2_000, c: 0 } } },
          {
            name: `a tx ${FUTURE_SKEW_MS} ms ahead is still accepted`,
            clock: last,
            remote: { pt: NOW + FUTURE_SKEW_MS, c: 0 },
            expected: { _tag: 'ok', last: { pt: NOW + FUTURE_SKEW_MS, c: 0 } },
          },
          {
            name: `a tx ${FUTURE_SKEW_MS + 1} ms in the future must be refused`,
            clock: last,
            remote: { pt: NOW + FUTURE_SKEW_MS + 1, c: 0 },
            expected: { _tag: 'future_skew', boundMs: FUTURE_SKEW_MS },
          },
        ] as const
        for (const { name, clock, remote, expected } of steps) {
          const result = impl.receive(NOW, clock, remote)
          yield* note(`receive ${at(remote)} with clock ${clock === null ? 'unset' : at(clock)}: ${said(result)}`)
          expect(result, name).toEqual(expected)
        }
      }),
    failsWith: /ms in the future must be refused/,
  })
})
