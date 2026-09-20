/**
 * Hybrid logical clock for `tx` (D33', ADR-0007). Pure functions; clocks and
 * entropy are injected. P04 pins the future-skew bound and the ULID-shaped
 * 128-bit layout: 48-bit `pt`, 16-bit counter, 32-bit device fingerprint,
 * 32-bit entropy.
 */
export const FUTURE_SKEW_MS = 5_000
export const APPEND_VOLUME = 2_000

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export const TX_LENGTH = 26
export const TX_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/
const COUNTER_MAX = 0xffff

export type Tx = string & { readonly _brand: 'Tx' }

export type Hlc = {
  readonly pt: number
  readonly c: number
  readonly tx: Tx
}

export type BootSession = {
  readonly monotonicOrigin: number
  readonly correctedOrigin: number
}

export const isTx = (value: string): value is Tx => TX_PATTERN.test(value)

export const fingerprintDevice = (deviceId: string): number => {
  let hash = 2166136261
  for (let index = 0; index < deviceId.length; index++) {
    hash ^= deviceId.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const encodeBytes = (bytes: Uint8Array): string => {
  let acc = 0
  let accBits = 2
  let encoded = ''
  for (const byte of bytes) {
    acc = (acc << 8) | byte
    accBits += 8
    while (accBits >= 5) {
      accBits -= 5
      encoded += ENCODING[(acc >> accBits) & 31]
      acc &= (1 << accBits) - 1
    }
  }
  return encoded
}

const decodeBytes = (encoded: string): Uint8Array | null => {
  if (!TX_PATTERN.test(encoded)) return null
  const bytes = new Uint8Array(16)
  let acc = 0
  let accBits = 0
  let byteIndex = 0
  let skipBits = 2
  for (const character of encoded) {
    const digit = ENCODING.indexOf(character)
    if (digit < 0) return null
    acc = (acc << 5) | digit
    accBits += 5
    if (skipBits > 0) {
      const consumed = Math.min(skipBits, accBits)
      accBits -= consumed
      skipBits -= consumed
      acc &= (1 << accBits) - 1
    }
    while (accBits >= 8 && byteIndex < 16) {
      accBits -= 8
      bytes[byteIndex] = (acc >> accBits) & 0xff
      byteIndex += 1
      acc &= (1 << accBits) - 1
    }
  }
  return byteIndex === 16 ? bytes : null
}

const writeUint48 = (view: DataView, pt: number): void => {
  const high = Math.floor(pt / 0x1_0000_0000)
  const low = pt % 0x1_0000_0000
  view.setUint16(0, high)
  view.setUint32(2, low)
}

const readUint48 = (view: DataView): number =>
  view.getUint16(0) * 0x1_0000_0000 + view.getUint32(2)

export const encodeHlc = (
  pt: number,
  c: number,
  deviceFp: number,
  random: number,
): Tx => {
  const bytes = new Uint8Array(16)
  const view = new DataView(bytes.buffer)
  writeUint48(view, pt)
  view.setUint16(6, c)
  view.setUint32(8, deviceFp >>> 0)
  view.setUint32(12, random >>> 0)
  return encodeBytes(bytes) as Tx
}

export const decodeHlc = (
  tx: string,
): { pt: number; c: number; deviceFp: number; random: number } | null => {
  const bytes = decodeBytes(tx)
  if (!bytes) return null
  const view = new DataView(bytes.buffer)
  return {
    pt: readUint48(view),
    c: view.getUint16(6),
    deviceFp: view.getUint32(8),
    random: view.getUint32(12),
  }
}

export const compareHlc = (
  left: { pt: number; c: number },
  right: { pt: number; c: number },
): number => {
  if (left.pt !== right.pt) return left.pt < right.pt ? -1 : 1
  if (left.c !== right.c) return left.c < right.c ? -1 : 1
  return 0
}

export const maxHlc = (left: Hlc, right: Hlc): Hlc =>
  compareHlc(left, right) >= 0 ? left : right

export const correctedNow = (input: {
  wallMs: number
  monotonicMs: number
  offsetMs: number
  lastPt: number
  boot: BootSession | null
}): { now: number; boot: BootSession } => {
  if (input.boot) {
    return {
      now: input.boot.correctedOrigin + (input.monotonicMs - input.boot.monotonicOrigin),
      boot: input.boot,
    }
  }
  const wallCorrected = input.wallMs + input.offsetMs
  const now = wallCorrected > input.lastPt ? wallCorrected : input.lastPt
  return {
    now,
    boot: {
      monotonicOrigin: input.monotonicMs,
      correctedOrigin: now,
    },
  }
}

export const mintHlc = (input: {
  now: number
  last: Hlc | null
  deviceFp: number
  random: number
}): Hlc => {
  let pt: number
  let c: number
  if (!input.last || input.now > input.last.pt) {
    pt = input.now
    c = 0
  } else if (input.last.c < COUNTER_MAX) {
    pt = input.last.pt
    c = input.last.c + 1
  } else {
    pt = input.last.pt + 1
    c = 0
  }
  return { pt, c, tx: encodeHlc(pt, c, input.deviceFp, input.random) }
}

export type ReceiveResult =
  | { readonly _tag: 'ok'; readonly last: Hlc }
  | {
      readonly _tag: 'future_skew'
      readonly pt: number
      readonly now: number
      readonly boundMs: number
    }
  | { readonly _tag: 'invalid_tx' }

export const receiveHlc = (input: {
  last: Hlc | null
  remoteTx: string
  now: number
}): ReceiveResult => {
  if (!isTx(input.remoteTx)) return { _tag: 'invalid_tx' }
  const parts = decodeHlc(input.remoteTx)
  if (!parts) return { _tag: 'invalid_tx' }
  if (parts.pt > input.now + FUTURE_SKEW_MS) {
    return {
      _tag: 'future_skew',
      pt: parts.pt,
      now: input.now,
      boundMs: FUTURE_SKEW_MS,
    }
  }
  const remote: Hlc = { pt: parts.pt, c: parts.c, tx: input.remoteTx }
  return {
    _tag: 'ok',
    last: input.last ? maxHlc(input.last, remote) : remote,
  }
}
