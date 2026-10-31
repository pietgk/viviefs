/**
 * An attribute's value is an Effect Schema (D209). The text in `v` and the
 * column a read model gives it are derived from that Schema, so the catalog
 * declares no value types of its own.
 */
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import type * as SchemaRepresentation from 'effect/SchemaRepresentation'

/** A value Schema needs no services: every node decodes alike. */
export type ValueSchema = Schema.Top & {
  readonly DecodingServices: never
  readonly EncodingServices: never
}

export type ColumnImplementation = 'sqlite' | 'postgres' | 'arrow'

type ColumnKind = 'integer' | 'real' | 'boolean' | 'text' | 'instant' | 'json'

const COLUMN_TYPES: Record<
  ColumnKind,
  Record<ColumnImplementation, string>
> = {
  integer: { sqlite: 'INTEGER', postgres: 'BIGINT', arrow: 'Int64' },
  real: { sqlite: 'REAL', postgres: 'DOUBLE PRECISION', arrow: 'Float64' },
  boolean: { sqlite: 'INTEGER', postgres: 'BOOLEAN', arrow: 'Boolean' },
  text: { sqlite: 'TEXT', postgres: 'TEXT', arrow: 'Utf8' },
  instant: {
    sqlite: 'INTEGER',
    postgres: 'TIMESTAMPTZ',
    arrow: 'Timestamp(ms, UTC)',
  },
  json: { sqlite: 'TEXT', postgres: 'JSONB', arrow: 'Utf8' },
}

/**
 * The Effect ids a column type depends on. Effect's own `id` stays an open
 * `string`, because anyone may register one; this set is what the mapping
 * reads, so an id Effect renames fails the column-type tests.
 */
const EffectId = {
  isInt: 'effect/schema/isInt',
  dateTimeUtc: 'effect/schema/DateTimeUtc',
  date: 'effect/schema/Date',
} as const

type EffectId = (typeof EffectId)[keyof typeof EffectId]

/** A check may sit inside a group, as `isInt32` holds `isInt`. */
const hasCheck = (
  checks: ReadonlyArray<SchemaRepresentation.Check>,
  id: EffectId,
): boolean =>
  checks.some(
    (check) =>
      check.representation?.id === id ||
      (check._tag === 'FilterGroup' && hasCheck(check.checks, id)),
  )

const isStringLiteral = (node: SchemaRepresentation.Representation): boolean =>
  node._tag === 'Literal' && typeof node.literal === 'string'

const kindOfNode = (
  node: SchemaRepresentation.Representation,
  references: SchemaRepresentation.References,
): ColumnKind => {
  switch (node._tag) {
    case 'Reference': {
      const target = references[node.$ref]
      return target ? kindOfNode(target, references) : 'json'
    }
    case 'Number':
      return hasCheck(node.checks, EffectId.isInt) ? 'integer' : 'real'
    case 'Boolean':
      return 'boolean'
    case 'String':
      return 'text'
    case 'Literal':
      return isStringLiteral(node) ? 'text' : 'json'
    case 'Union':
      return node.types.every(isStringLiteral) ? 'text' : 'json'
    case 'Declaration':
      return node.representation?.id === EffectId.dateTimeUtc ||
        node.representation?.id === EffectId.date
        ? 'instant'
        : 'json'
    default:
      return 'json'
  }
}

const kinds = new WeakMap<ValueSchema, ColumnKind>()

const kindOf = (schema: ValueSchema): ColumnKind => {
  const known = kinds.get(schema)
  if (known) return known
  const { representation, references } = Schema.toRepresentation(schema)
  const kind = kindOfNode(representation, references)
  kinds.set(schema, kind)
  return kind
}

export const columnType = (
  schema: ValueSchema,
  implementation: ColumnImplementation,
): string => COLUMN_TYPES[kindOf(schema)][implementation]

/** A table's column: byte order on Postgres too, as on SQLite (D110). */
export const columnDeclaration = (
  schema: ValueSchema,
  implementation: ColumnImplementation,
): string => {
  const type = columnType(schema, implementation)
  return implementation === 'postgres' && type === 'TEXT'
    ? 'TEXT COLLATE "C"'
    : type
}

/**
 * How to select a quoted column. JSONB as text: a driver's parsed value cannot
 * tell JSON `null` from an empty column, or a JSON string from JSON text.
 */
export const columnSelection = (
  quotedName: string,
  schema: ValueSchema,
  implementation: ColumnImplementation,
): string =>
  columnType(schema, implementation) === 'JSONB'
    ? `${quotedName}::text AS ${quotedName}`
    : quotedName

/** Moves surrogates past the code units above them, into code point order. */
const codePointRank = (unit: number): number => {
  if (unit >= 0xe000) return unit - 0x800
  return unit >= 0xd800 ? unit + 0x2000 : unit
}

/**
 * Code point order, which is the byte order of UTF-8: what SQLite and
 * `COLLATE "C"` sort by. JavaScript's `<` compares UTF-16 code units.
 */
export const compareBytes = (left: string, right: string): number => {
  const shared = Math.min(left.length, right.length)
  for (let index = 0; index < shared; index++) {
    const a = left.charCodeAt(index)
    const b = right.charCodeAt(index)
    if (a !== b) return codePointRank(a) - codePointRank(b)
  }
  return left.length - right.length
}

/** The description the Schema carries, for people and agents (D209). */
export const descriptionOf = (schema: ValueSchema): string | undefined => {
  const { description } = Schema.toJsonSchemaDocument(schema).schema
  return typeof description === 'string' ? description : undefined
}

type TextCodec = {
  readonly decode: (text: string) => Option.Option<unknown>
  readonly encode: (value: unknown) => Option.Option<string>
}

const singleValueCodec = (schema: ValueSchema): TextCodec => {
  const codec = Schema.toCodecStringTree(schema)
  const decode = Schema.decodeUnknownOption(codec)
  const encode = Schema.encodeUnknownOption(codec)
  return {
    decode,
    encode: (value) =>
      Option.filter(
        encode(value),
        (encoded): encoded is string => typeof encoded === 'string',
      ),
  }
}

const parseJson = (text: string): Option.Option<unknown> =>
  Option.liftThrowable(JSON.parse)(text)

const structuredCodec = (schema: ValueSchema): TextCodec => {
  const codec = Schema.toCodecJson(schema)
  const decode = Schema.decodeUnknownOption(codec)
  const encode = Schema.encodeUnknownOption(codec)
  return {
    decode: (text) => Option.flatMap(parseJson(text), decode),
    encode: (value) => Option.map(encode(value), (json) => JSON.stringify(json)),
  }
}

const codecs = new WeakMap<ValueSchema, TextCodec>()

const textCodec = (schema: ValueSchema): TextCodec => {
  const known = codecs.get(schema)
  if (known) return known
  const made =
    kindOf(schema) === 'json' ? structuredCodec(schema) : singleValueCodec(schema)
  codecs.set(schema, made)
  return made
}

/** The one text of a value (D209). A value the Schema refuses has none. */
export const encodeTextOption = (
  schema: ValueSchema,
  value: unknown,
): Option.Option<string> => textCodec(schema).encode(value)

export const encodeText = (schema: ValueSchema, value: unknown): string =>
  Option.getOrThrow(encodeTextOption(schema, value))

/**
 * The typed value of a text, or none when the Schema refuses it or the text
 * is not the one way of writing that value: decoding and encoding again must
 * give the same text, which refuses `010` for an integer.
 */
export const decodeText = (
  schema: ValueSchema,
  text: string,
): Option.Option<unknown> =>
  Option.filter(textCodec(schema).decode(text), (value) =>
    Option.contains(encodeTextOption(schema, value), text),
  )

/** What a read model stores for a canonical text, in each implementation. */
export const toColumn = (
  schema: ValueSchema,
  implementation: ColumnImplementation,
  text: string,
): string | number | boolean => {
  switch (kindOf(schema)) {
    case 'integer':
    case 'real':
      return Number(text)
    case 'boolean':
      return implementation === 'sqlite' ? (text === 'true' ? 1 : 0) : text === 'true'
    case 'instant':
      return implementation === 'sqlite' ? Date.parse(text) : text
    case 'text':
    case 'json':
      return text
  }
}

const isoOf = (implementation: ColumnImplementation, raw: unknown): string =>
  raw instanceof Date
    ? raw.toISOString()
    : new Date(implementation === 'sqlite' ? Number(raw) : String(raw)).toISOString()

const textOfColumn = (
  kind: ColumnKind,
  implementation: ColumnImplementation,
  raw: unknown,
): string => {
  switch (kind) {
    case 'boolean':
      return raw === 1 || raw === true ? 'true' : 'false'
    case 'instant':
      return isoOf(implementation, raw)
    case 'integer':
    case 'real':
    case 'text':
    case 'json':
      return String(raw)
  }
}

/**
 * The typed value a column holds. The text was checked when it was projected,
 * and JSONB read as text does not keep key order or spacing, so this does not
 * ask for the canonical text again.
 */
export const fromColumn = (
  schema: ValueSchema,
  implementation: ColumnImplementation,
  raw: unknown,
): Option.Option<unknown> =>
  textCodec(schema).decode(textOfColumn(kindOf(schema), implementation, raw))
