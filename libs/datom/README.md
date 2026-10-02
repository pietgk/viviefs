# @viviefs/datom

Datoms, the hybrid logical clock and the `LogStore` service every store shares, over Effect's `SqlClient`. Also the changesets and projections code, which a later guide covers.

Guide: [Log store](../../apps/docs/src/content/docs/guides/log-store/index.mdx).

Unit tests run in `verify`'s `unit` step. The `log-store/conformance` and `changesets/conformance` suites live in `src/suites/` and are exported as `@viviefs/datom/suites`; each store project runs them.
