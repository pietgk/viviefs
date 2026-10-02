import { describe, expect } from '@effect/vitest'
import { FUTURE_SKEW_MS } from '@viviefs/datom'
import { exercise } from '@viviefs/testing/exercise'
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
      Effect.sync(() => {
        const last = { pt: NOW, c: 2 }
        expect(impl.receive(NOW, null, last), 'a first remote tx becomes the clock').toEqual({ _tag: 'ok', last })
        expect(impl.receive(NOW, last, { pt: NOW - 10, c: 9 }), 'a remote tx behind changes nothing').toEqual({
          _tag: 'ok',
          last,
        })
        const ahead = { pt: NOW + 2_000, c: 0 }
        expect(impl.receive(NOW, last, ahead), 'a remote tx ahead moves the clock up').toEqual({
          _tag: 'ok',
          last: ahead,
        })
        const atBound = { pt: NOW + FUTURE_SKEW_MS, c: 0 }
        expect(impl.receive(NOW, last, atBound), `a tx ${FUTURE_SKEW_MS} ms ahead is still accepted`).toEqual({
          _tag: 'ok',
          last: atBound,
        })
        expect(
          impl.receive(NOW, last, { pt: NOW + FUTURE_SKEW_MS + 1, c: 0 }),
          `a tx ${FUTURE_SKEW_MS + 1} ms in the future must be refused`,
        ).toEqual({ _tag: 'future_skew', boundMs: FUTURE_SKEW_MS })
      }),
    failsWith: /ms in the future must be refused/,
  })
})
