import { describe, expect, it } from '@effect/vitest'
import * as DateTime from 'effect/DateTime'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import {
  columnType,
  decodeText,
  encodeText,
  fromColumn,
  toColumn,
} from './values.ts'

const Quantity = Schema.Int.check(
  Schema.isBetween({ minimum: 0, maximum: 100 }),
)
const Lease = Schema.Struct({ device: Schema.String, epoch: Schema.Int })

describe('the text of a value in the log', () => {
  it('encodes a value as Effect encodes it', () => {
    expect(encodeText(Quantity, 10)).toBe('10')
    expect(encodeText(Schema.Boolean, true)).toBe('true')
    expect(encodeText(Schema.String, 'x')).toBe('x')
    expect(
      encodeText(Schema.DateTimeUtc, DateTime.makeUnsafe(0)),
    ).toBe('1970-01-01T00:00:00.000Z')
  })

  it('encodes a structured value as JSON text', () => {
    expect(encodeText(Lease, { device: 'd1', epoch: 2 })).toBe(
      '{"device":"d1","epoch":2}',
    )
  })

  it('decodes canonical text to the typed value', () => {
    expect(decodeText(Quantity, '10')).toEqual(Option.some(10))
    expect(decodeText(Schema.Boolean, 'false')).toEqual(Option.some(false))
    expect(decodeText(Lease, '{"device":"d1","epoch":2}')).toEqual(
      Option.some({ device: 'd1', epoch: 2 }),
    )
  })

  it('refuses text that is not the one way of writing the value', () => {
    expect(decodeText(Quantity, '010')).toEqual(Option.none())
    expect(decodeText(Quantity, '1e1')).toEqual(Option.none())
    expect(decodeText(Lease, '{"epoch":2,"device":"d1"}')).toEqual(
      Option.none(),
    )
    expect(decodeText(Schema.DateTimeUtc, '010')).toEqual(Option.none())
  })

  it('refuses a value outside its range or type', () => {
    expect(decodeText(Quantity, '101')).toEqual(Option.none())
    expect(decodeText(Quantity, 'ten')).toEqual(Option.none())
    expect(decodeText(Lease, 'not json')).toEqual(Option.none())
  })
})

describe('the column a value gets', () => {
  const Status = Schema.Literals(['open', 'closed'])
  const cases = [
    ['an integer', Quantity, 'INTEGER', 'BIGINT', 'Int64'],
    ['a 32-bit integer', Schema.Number.check(Schema.isInt32()), 'INTEGER', 'BIGINT', 'Int64'],
    ['a named integer', Schema.Int.annotate({ identifier: 'Quantity' }), 'INTEGER', 'BIGINT', 'Int64'],
    ['a number', Schema.Finite, 'REAL', 'DOUBLE PRECISION', 'Float64'],
    ['a boolean', Schema.Boolean, 'INTEGER', 'BOOLEAN', 'Boolean'],
    ['a string', Schema.String, 'TEXT', 'TEXT', 'Utf8'],
    ['a literal', Schema.Literal('1'), 'TEXT', 'TEXT', 'Utf8'],
    ['a set of literals', Status, 'TEXT', 'TEXT', 'Utf8'],
    ['an instant', Schema.DateTimeUtc, 'INTEGER', 'TIMESTAMPTZ', 'Timestamp(ms, UTC)'],
    ['a structure', Lease, 'TEXT', 'JSONB', 'Utf8'],
    ['a list', Schema.Array(Schema.String), 'TEXT', 'JSONB', 'Utf8'],
    ['a number literal', Schema.Literal(1), 'TEXT', 'JSONB', 'Utf8'],
    ['a nullable string', Schema.NullOr(Schema.String), 'TEXT', 'JSONB', 'Utf8'],
    ['another declaration', Schema.URL, 'TEXT', 'JSONB', 'Utf8'],
  ] as const

  it.each(cases)('maps %s', (_name, schema, sqlite, postgres, arrow) => {
    expect(columnType(schema, 'sqlite')).toBe(sqlite)
    expect(columnType(schema, 'postgres')).toBe(postgres)
    expect(columnType(schema, 'arrow')).toBe(arrow)
  })
})

describe('a value in a column', () => {
  const Moment = Schema.DateTimeUtc
  const noon = '2026-10-30T12:00:00.000Z'
  const noonMs = 1_793_361_600_000

  it('stores the column type of each implementation', () => {
    expect(toColumn(Quantity, 'sqlite', '10')).toBe(10)
    expect(toColumn(Quantity, 'postgres', '10')).toBe(10)
    expect(toColumn(Schema.Boolean, 'sqlite', 'true')).toBe(1)
    expect(toColumn(Schema.Boolean, 'postgres', 'false')).toBe(false)
    expect(toColumn(Moment, 'sqlite', noon)).toBe(noonMs)
    expect(toColumn(Moment, 'postgres', noon)).toBe(noon)
    expect(toColumn(Lease, 'sqlite', '{"device":"d1","epoch":2}')).toBe(
      '{"device":"d1","epoch":2}',
    )
  })

  it('reads the typed value back from what each driver returns', () => {
    expect(fromColumn(Quantity, 'sqlite', 10)).toEqual(Option.some(10))
    expect(fromColumn(Quantity, 'postgres', '10')).toEqual(Option.some(10))
    expect(fromColumn(Quantity, 'postgres', 10n)).toEqual(Option.some(10))
    expect(fromColumn(Schema.Boolean, 'sqlite', 0)).toEqual(Option.some(false))
    expect(fromColumn(Schema.Boolean, 'postgres', true)).toEqual(
      Option.some(true),
    )
    expect(
      Option.map(fromColumn(Moment, 'sqlite', noonMs), (value) =>
        encodeText(Moment, value),
      ),
    ).toEqual(Option.some(noon))
    expect(
      Option.map(fromColumn(Moment, 'postgres', new Date(noon)), (value) =>
        encodeText(Moment, value),
      ),
    ).toEqual(Option.some(noon))
  })

  it('stores a number as a number and reads it back', () => {
    expect(toColumn(Schema.Finite, 'sqlite', '1.5')).toBe(1.5)
    expect(fromColumn(Schema.Finite, 'postgres', 1.5)).toEqual(Option.some(1.5))
  })

  it('reads an instant Postgres returned as text', () => {
    expect(
      Option.map(fromColumn(Moment, 'postgres', noon), (value) =>
        encodeText(Moment, value),
      ),
    ).toEqual(Option.some(noon))
  })

  it('reads a structure from JSON text or from a parsed JSONB value', () => {
    const lease = { device: 'd1', epoch: 2 }
    expect(fromColumn(Lease, 'sqlite', JSON.stringify(lease))).toEqual(
      Option.some(lease),
    )
    expect(fromColumn(Lease, 'postgres', { epoch: 2, device: 'd1' })).toEqual(
      Option.some(lease),
    )
  })
})
