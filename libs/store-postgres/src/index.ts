/**
 * Log store on Postgres. Qualified by P04 (PGlite postgres dialect).
 *
 * Guide: apps/docs/src/content/docs/guides/log-store/index.mdx
 */
export { pgliteClientLayer, pgliteLayer, pgliteLogStore } from './layer.ts'
