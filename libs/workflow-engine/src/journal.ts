import * as Exit from 'effect/Exit'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import * as Workflow from 'effect/unstable/workflow/Workflow'

export const StartedValue = Schema.Struct({
  name: Schema.String,
  payload: Schema.Unknown,
})
export type StartedValue = typeof StartedValue.Type

export const LeaseValue = Schema.Struct({
  device: Schema.String,
  epoch: Schema.Number,
  expiresAtMs: Schema.NullOr(Schema.Number),
})
export type LeaseValue = typeof LeaseValue.Type

export const ClockValue = Schema.Struct({
  workflowName: Schema.String,
  name: Schema.String,
  deferredName: Schema.String,
  wakeAtMs: Schema.Number,
})
export type ClockValue = typeof ClockValue.Type

export const EncodedExit = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literals(['Success']),
    value: Schema.Unknown,
  }),
  Schema.Struct({
    _tag: Schema.Literals(['Failure']),
    error: Schema.Unknown,
  }),
])
export type EncodedExit = typeof EncodedExit.Type

const StartedJson = Schema.fromJsonString(StartedValue)
const LeaseJson = Schema.fromJsonString(LeaseValue)
const ClockJson = Schema.fromJsonString(ClockValue)
const ExitJson = Schema.fromJsonString(EncodedExit)

export const encodeStarted = (value: StartedValue): string =>
  Schema.encodeSync(StartedJson)(value)

export const decodeStarted = (value: string): StartedValue | null =>
  Option.getOrNull(Schema.decodeUnknownOption(StartedJson)(value))

export const encodeLease = (value: LeaseValue): string =>
  Schema.encodeSync(LeaseJson)(value)

export const decodeLease = (value: string): LeaseValue | null =>
  Option.getOrNull(Schema.decodeUnknownOption(LeaseJson)(value))

export const encodeClock = (value: ClockValue): string =>
  Schema.encodeSync(ClockJson)(value)

export const decodeClock = (value: string): ClockValue | null =>
  Option.getOrNull(Schema.decodeUnknownOption(ClockJson)(value))

export const encodeExit = (exit: Exit.Exit<unknown, unknown>): string =>
  Schema.encodeSync(ExitJson)(
    exit._tag === 'Success'
      ? { _tag: 'Success', value: exit.value ?? null }
      : { _tag: 'Failure', error: String(exit.cause) },
  )

export const decodeExit = (
  value: string,
): Exit.Exit<unknown, unknown> | null => {
  const parsed = Option.getOrNull(Schema.decodeUnknownOption(ExitJson)(value))
  if (!parsed) return null
  return parsed._tag === 'Success'
    ? Exit.succeed(parsed.value)
    : Exit.fail(parsed.error)
}

export const completeFromExit = (
  exit: Exit.Exit<unknown, unknown>,
): Workflow.Complete<unknown, unknown> => new Workflow.Complete({ exit })
