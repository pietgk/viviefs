/**
 * Runs the evidence server. Configuration comes from the environment:
 *
 * - `VIVIEFS_ISSUER` (required): the OIDC issuer URL, exactly as it appears
 *   in tokens.
 * - `VIVIEFS_AUDIENCE`: the audience tokens must carry (`viviefs-sync`).
 * - `VIVIEFS_HOST`, `VIVIEFS_PORT`: where to listen (`127.0.0.1:8787`).
 * - `VIVIEFS_DATA_DIR`: PGlite data directory (in memory when unset).
 * - `VIVIEFS_SEED`: path to a JSON array of `{ org, account: { issuer,
 *   subject } }` memberships to grant at start.
 * - `VIVIEFS_CORS_ORIGINS`: comma-separated browser origins allowed to call
 *   `/rpc` (the web app, `http://localhost:8081` in the lab).
 */
import { readFileSync } from 'node:fs'
import * as NodeRuntime from '@effect/platform-node/NodeRuntime'
import * as Config from 'effect/Config'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import { SeedGrant, evidenceServerLayer } from './server.ts'

const SeedFile = Schema.fromJsonString(Schema.Array(SeedGrant))

const program = Effect.gen(function* () {
  const issuer = yield* Config.String('VIVIEFS_ISSUER')
  const audience = yield* Config.String('VIVIEFS_AUDIENCE').pipe(
    Config.withDefault('viviefs-sync'),
  )
  const host = yield* Config.String('VIVIEFS_HOST').pipe(
    Config.withDefault('127.0.0.1'),
  )
  const port = yield* Config.Int('VIVIEFS_PORT').pipe(Config.withDefault(8787))
  const dataDir = yield* Config.option(Config.String('VIVIEFS_DATA_DIR'))
  const seedPath = yield* Config.option(Config.String('VIVIEFS_SEED'))
  const corsOrigins = yield* Config.String('VIVIEFS_CORS_ORIGINS').pipe(
    Config.withDefault(''),
  )
  const seed = Option.isSome(seedPath)
    ? yield* Schema.decodeUnknownEffect(SeedFile)(
        readFileSync(seedPath.value, 'utf8'),
      )
    : []
  yield* Effect.logInfo(`evidence server on http://${host}:${port}/rpc for ${issuer}`)
  return yield* Layer.launch(
    evidenceServerLayer({
      host,
      port,
      issuer,
      audience,
      seed,
      corsOrigins: corsOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
      ...(Option.isSome(dataDir) ? { dataDir: dataDir.value } : {}),
    }),
  )
})

NodeRuntime.runMain(program)
