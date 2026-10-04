# I31: Ideas batch: DataFrames as a universal data format

Status: needs-triage

Category: enhancement

Found: 2026-10-04

Series: ideas-batch, fifth batch: `ideas-batch-dataframes-as-a-universal-data-format`

## What

DataFrames, stored in column-oriented formats (Arrow in memory, Parquet on disk) and manipulated with DuckDB or Polars, could become one way to work with data on every device, and so a pattern of this stack, next to the log store pattern that keeps the datom log in SQLite and Postgres. Today they appear only in the analytics projection that D37 and ADR-0011 already name. This issue keeps the idea of looking wider: when, where and how DataFrames could be used in this reference stack, and whether one DataFrame library can run on the phone, in the browser and on the server. This issue does not decide anything.

## The idea

- **Row storage for the log, column storage for analysis.** The log store keeps datoms row by row in SQLite and Postgres, which suits appending changesets and reading one entity. Parquet and Arrow store each column together, which suits scanning, grouping and aggregating many rows.
- **Arrow as the meeting point.** Arrow is a column-oriented memory format several libraries share, so one library's result can be read by another without copying: a Polars filter whose result DuckDB queries with SQL, or the reverse.
- **One way to manipulate data everywhere.** If one DataFrame library ran on every device this stack supports, reading, filtering and aggregating data could be written once and become a pattern, with a contract and suites like the log store's.

## What ViViEfs has decided already

- D37 and ADR-0011: "Analytics is a projection to Parquet or DuckLake queried by DuckDB. DuckDB is never the durable log." The log stays the source; analytics is one more projection of it.
- `docs/plan/bootstrap/10-open-items-and-risks.md`: Effect v4 has no DuckDB `SqlClient`, so analytics writes files DuckDB reads. Checked again on Effect 4.0.0: its SQL drivers are ClickHouse, D1, libSQL, MSSQL, MySQL, Postgres, PGlite and SQLite (Bun, Durable Objects, Node, React Native, wasm). ClickHouse is the one column-oriented database among them.
- The durable log is not Effect's `EventLog`: D21 studied it and did not adopt it. The log store pattern keeps our own datom log.

## Where the libraries run

Checked on 2026-10-04 on npm and GitHub.

| | Server (Node) | Browser | Phone (React Native) |
| --- | --- | --- | --- |
| DuckDB | `@duckdb/node-api` 1.5.6 (MIT), active | `@duckdb/duckdb-wasm` (MIT, about 2,100 stars), active | `react-native-duckdb` 1.0.0 (MIT, February 2026, Nitro Modules), small: 15 stars, one maintainer, no change since its release |
| Polars | `nodejs-polars` 0.26.1 (MIT), active; Node, Bun and Deno only | `@pola-rs/browser` 0.0.1-alpha from 2023; `js-polars` unchanged since November 2023 | nothing; Polars is Rust, so a native module is possible but none exists |
| Arrow | `apache-arrow` 21.2.0 (Apache-2.0), plain JavaScript | the same | the same package; not yet tried on Hermes |

So today DuckDB, not Polars, is the library that reaches all three, and the phone is its weakest place. Callstack's [react-native-node-api](https://github.com/callstackincubator/react-native-node-api) brings Node-API modules to React Native, which may one day let a Node binding like `nodejs-polars` run on a phone; it would need iOS and Android builds that do not exist.

## Where DataFrames could fit

- **The analytics projection** (D37): already decided; the open part is how the projector writes Parquet or DuckLake, and from which cursor.
- **Read models on the device.** Some screens summarize many rows (totals, groups, timelines). A columnar copy could answer those faster than typed SQLite tables, at the cost of a second projection to keep fresh.
- **Moving data.** Arrow batches of datoms instead of JSON for sync or bulk export: smaller and faster to read, but a second wire format next to the one the commands check.
- **Telemetry and evidence.** Traces, the qualification ledger, coverage and bundle reports are tables already; DuckDB over Parquet makes them queryable for a reviewer or an agent.
- **Understanding the code base** (I25). vivief's DevAC kept its code graph in Parquet files queried by DuckDB; a code graph or effects extracted from code here would fit the same format, and so would the queries behind a live diagram.
- **Notebooks** (I25). DuckDB and Polars are what notebooks use to explore data; a notebook over the datom log or the traces would use them.

## Questions for the brainstorm

- **Why.** Which question does a reader, a user or an operator of this stack need answered that row storage answers badly today? That decides whether this is a pattern, a projection, or only a tool for development.
- **Datoms as columns.** A datom is `[entity, attribute, value, tx, op]`, and its value can be any type. Does a columnar copy use one value column per type, a union type, or one table per attribute or per entity type (as the read models do)?
- **Which library.** DuckDB everywhere (SQL, all three platforms today), Polars where it runs (a DataFrame API, server only for now), or Arrow as the shared format with either one on top?
- **The phone.** Is `react-native-duckdb` good enough for a reference stack, what does it add to the app's size and start time, and does `apache-arrow` run on Hermes?
- **Effect.** No `SqlClient` for DuckDB: wrap one as a service of our own, contribute a driver, or keep DuckDB behind a narrow boundary that only reads files?
- **A pattern or not.** If it becomes a pattern, what is its contract, which suites prove it on each platform, and which gate qualifies it?

## Comments
