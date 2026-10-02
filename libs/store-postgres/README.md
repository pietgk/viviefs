# @viviefs/store-postgres

The log store on Postgres, qualified through PGlite (`@effect/sql-pglite`): a `SqlClient` Layer plus the shared `LogStore`.

Guide: [Log store](../../apps/docs/src/content/docs/guides/log-store/index.mdx).

`log-store/conformance` and `changesets/conformance` run in `verify`'s `integration` step on PGlite; P04 and P05 qualify it.
