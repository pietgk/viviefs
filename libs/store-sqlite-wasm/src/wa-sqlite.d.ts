/**
 * The two wa-sqlite modules `opfs.ts` loads directly. `@effect/wa-sqlite`
 * ships no declarations for them; these name only what this package uses.
 */
declare module '@effect/wa-sqlite/dist/wa-sqlite.mjs' {
  const SQLiteESMFactory: () => Promise<unknown>
  export default SQLiteESMFactory
}

declare module '@effect/wa-sqlite/src/examples/AccessHandlePoolVFS.js' {
  export class AccessHandlePoolVFS {
    static create(name: string, module: unknown): Promise<AccessHandlePoolVFS>
    jDelete(name: string, syncDir: number): number
    close(): Promise<void>
  }
}
