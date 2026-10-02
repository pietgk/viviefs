import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import * as Workflow from 'effect/workflow/Workflow'

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

export const ActivityStartedValue = Schema.Struct({
  name: Schema.String,
  attempt: Schema.Number,
})
export type ActivityStartedValue = typeof ActivityStartedValue.Type

/**
 * Exit values in the journal (`activity/exit`, `deferred/exit`,
 * `workflow/result`). The exit is already encoded by the activity, deferred
 * or workflow schema; the journal keeps its whole cause (typed failure,
 * defect, interruption) as JSON through Effect's exit codec, the same codec
 * Effect's cluster engine persists. Replay hands the workflow back exactly
 * the exit its first run saw.
 *
 * Legacy shape, read only: journals written before commit a067a0d6f stored a
 * failure as `{ _tag: "Failure", error: <printed cause> }`. It still
 * decodes, as a typed failure carrying that text.
 */
const AnyOrVoid = Schema.Union([Schema.Undefined, Schema.Unknown])
const ExitCodec = Schema.toCodecJson(Schema.Exit(AnyOrVoid, AnyOrVoid, Schema.Defect()))

const LegacyFailure = Schema.Struct({
  _tag: Schema.Literals(['Failure']),
  error: Schema.Unknown,
})

const StartedJson = Schema.fromJsonString(StartedValue)
const LeaseJson = Schema.fromJsonString(LeaseValue)
const ClockJson = Schema.fromJsonString(ClockValue)
const ExitJson = Schema.fromJsonString(ExitCodec)
const LegacyFailureJson = Schema.fromJsonString(LegacyFailure)
const ActivityStartedJson = Schema.fromJsonString(ActivityStartedValue)

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

export const encodeActivityStarted = (value: ActivityStartedValue): string =>
  Schema.encodeSync(ActivityStartedJson)(value)

export const decodeActivityStarted = (
  value: string,
): ActivityStartedValue | null =>
  Option.getOrNull(Schema.decodeUnknownOption(ActivityStartedJson)(value))

export const encodeExit = (exit: Exit.Exit<unknown, unknown>): string =>
  Schema.encodeSync(ExitJson)(exit)

export const decodeExit = (
  value: string,
): Exit.Exit<unknown, unknown> | null => {
  const current = Schema.decodeUnknownOption(ExitJson)(value)
  if (Option.isSome(current)) return current.value
  const legacy = Schema.decodeUnknownOption(LegacyFailureJson)(value)
  return Option.isSome(legacy) ? Exit.fail(legacy.value.error) : null
}

/**
 * `workflow/result` holds the workflow's own exit. Effect's engine contract
 * hands workflow results over typed, so the journal encodes and decodes them
 * with the workflow's success and error schemas (as Effect's cluster engine
 * does for its run results). The stored JSON is still plain encoded values,
 * so `decodeExit` reads it for status. A value that does not decode with the
 * schemas (a legacy entry) falls back to `decodeExit`.
 */
type WorkflowSchemas = {
  readonly successSchema: Schema.Top
  readonly errorSchema: Schema.Top
}

const workflowExitJson = (workflow: WorkflowSchemas) =>
  Schema.fromJsonString(
    Schema.toCodecJson(
      Schema.Exit(workflow.successSchema, workflow.errorSchema, Schema.Defect()),
    ),
  )

export const encodeWorkflowExit = (
  workflow: WorkflowSchemas,
  exit: Exit.Exit<unknown, unknown>,
): Effect.Effect<string> =>
  (Schema.encodeUnknownEffect(workflowExitJson(workflow))(exit) as Effect.Effect<
    string,
    Schema.SchemaError
  >).pipe(Effect.orDie)

export const decodeWorkflowExit = (
  workflow: WorkflowSchemas,
  value: string,
): Effect.Effect<Exit.Exit<unknown, unknown> | null> =>
  (Schema.decodeUnknownEffect(workflowExitJson(workflow))(value) as Effect.Effect<
    Exit.Exit<unknown, unknown>,
    Schema.SchemaError
  >).pipe(Effect.orElseSucceed(() => decodeExit(value)))

export const completeFromExit = (
  exit: Exit.Exit<unknown, unknown>,
): Workflow.Complete<unknown, unknown> => new Workflow.Complete({ exit })
