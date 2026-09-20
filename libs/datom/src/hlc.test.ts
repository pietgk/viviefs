import { describe, expect, it } from '@effect/vitest'
import {
  FUTURE_SKEW_MS,
  TX_LENGTH,
  TX_PATTERN,
  compareHlc,
  correctedNow,
  decodeHlc,
  encodeHlc,
  fingerprintDevice,
  isTx,
  mintHlc,
  receiveHlc,
} from './hlc.ts'

const WALL = 1_700_000_000_000

describe('HLC encoding', () => {
  it('encodes 128 bits as a 26-character Crockford id', () => {
    const tx = encodeHlc(0, 0, 0, 0)
    expect(tx).toHaveLength(TX_LENGTH)
    expect(TX_PATTERN.test(tx)).toBe(true)
    expect(isTx(tx)).toBe(true)
    expect(decodeHlc(tx)).toEqual({ pt: 0, c: 0, deviceFp: 0, random: 0 })
  })

  it('round-trips physical time, counter, device fingerprint and entropy', () => {
    const tx = encodeHlc(WALL, 42, 0x89abcdef, 0x12345678)
    expect(decodeHlc(tx)).toEqual({
      pt: WALL,
      c: 42,
      deviceFp: 0x89abcdef,
      random: 0x12345678,
    })
  })

  it('sorts lexicographically by pt then counter', () => {
    const early = encodeHlc(WALL, 0, 1, 1)
    const laterSameMs = encodeHlc(WALL, 1, 1, 1)
    const nextMs = encodeHlc(WALL + 1, 0, 1, 1)
    expect(early < laterSameMs).toBe(true)
    expect(laterSameMs < nextMs).toBe(true)
  })

  it('keeps two devices distinct at the same (pt, c)', () => {
    const left = encodeHlc(WALL, 0, fingerprintDevice('device-a'), 1)
    const right = encodeHlc(WALL, 0, fingerprintDevice('device-b'), 1)
    expect(left).not.toBe(right)
  })
})

describe('HLC mint and receive', () => {
  const deviceFp = fingerprintDevice('probe')

  it('mints (now, 0) when time has advanced', () => {
    const first = mintHlc({ now: WALL, last: null, deviceFp, random: 1 })
    const second = mintHlc({
      now: WALL + 10,
      last: first,
      deviceFp,
      random: 2,
    })
    expect(first.pt).toBe(WALL)
    expect(first.c).toBe(0)
    expect(second.pt).toBe(WALL + 10)
    expect(second.c).toBe(0)
    expect(compareHlc(second, first)).toBe(1)
  })

  it('increments the counter when now would not advance pt', () => {
    const first = mintHlc({ now: WALL, last: null, deviceFp, random: 1 })
    const second = mintHlc({ now: WALL, last: first, deviceFp, random: 2 })
    expect(second.pt).toBe(WALL)
    expect(second.c).toBe(1)
    expect(first.tx < second.tx).toBe(true)
  })

  it('never mints below last after a backwards wall clock if corrected now is clamped', () => {
    const last = mintHlc({ now: WALL, last: null, deviceFp, random: 1 })
    const { now } = correctedNow({
      wallMs: WALL - 60_000,
      monotonicMs: 0,
      offsetMs: 0,
      lastPt: last.pt,
      boot: null,
    })
    const next = mintHlc({ now, last, deviceFp, random: 2 })
    expect(compareHlc(next, last)).toBe(1)
    expect(next.pt).toBe(last.pt)
    expect(next.c).toBe(1)
  })

  it('uses monotonic elapsed within a boot session when wall jumps backwards', () => {
    const session = correctedNow({
      wallMs: WALL,
      monotonicMs: 100,
      offsetMs: 0,
      lastPt: 0,
      boot: null,
    })
    const first = mintHlc({
      now: session.now,
      last: null,
      deviceFp,
      random: 1,
    })
    const later = correctedNow({
      wallMs: WALL - 60_000,
      monotonicMs: 250,
      offsetMs: 0,
      lastPt: first.pt,
      boot: session.boot,
    })
    const second = mintHlc({
      now: later.now,
      last: first,
      deviceFp,
      random: 2,
    })
    expect(later.now).toBe(session.now + 150)
    expect(compareHlc(second, first)).toBe(1)
  })

  it('adopts a remote-ahead HLC so the next mint is not below it', () => {
    const local = mintHlc({ now: WALL, last: null, deviceFp, random: 1 })
    const remote = mintHlc({
      now: WALL + 1_000,
      last: null,
      deviceFp: fingerprintDevice('other'),
      random: 9,
    })
    const received = receiveHlc({
      last: local,
      remoteTx: remote.tx,
      now: WALL,
    })
    expect(received._tag).toBe('ok')
    if (received._tag !== 'ok') return
    const next = mintHlc({
      now: WALL,
      last: received.last,
      deviceFp,
      random: 2,
    })
    expect(compareHlc(next, remote)).toBe(1)
    expect(next.pt).toBe(remote.pt)
    expect(next.c).toBe(remote.c + 1)
  })

  it(`rejects a tx more than ${FUTURE_SKEW_MS}ms ahead of corrected now`, () => {
    const remote = encodeHlc(WALL + FUTURE_SKEW_MS + 1, 0, deviceFp, 1)
    const received = receiveHlc({ last: null, remoteTx: remote, now: WALL })
    expect(received).toEqual({
      _tag: 'future_skew',
      pt: WALL + FUTURE_SKEW_MS + 1,
      now: WALL,
      boundMs: FUTURE_SKEW_MS,
    })
  })
})
