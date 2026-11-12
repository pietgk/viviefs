/**
 * verify / overlap (D221): one home for every piece of knowledge. A word's
 * meaning lives in the glossary, a concept's rule, diagram and code in its
 * partial (`apps/docs/src/partials/<pattern>/`), which the concepts page and
 * the lessons embed, and a lesson keeps only what is its own. Text written
 * twice drifts, so this fails a run of `RUN` or more words of prose that two
 * documents share. Code, components, imports, frontmatter and the names of
 * reference links are not prose. Pure over the documents it is given.
 */

export const RUN = 8

export type Document = { readonly path: string; readonly content: string }
export type Overlap = { readonly first: string; readonly second: string; readonly words: string }

/** The words of a document's prose, lower case, in order. */
export const proseWords = (content: string): ReadonlyArray<string> =>
  content
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/^```[\s\S]*?^```$/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^import .*$/gm, ' ')
    .replace(/^\[[^\]]+\]:.*$/gm, ' ')
    .replace(/<[A-Za-z][^>]*>|<\/[A-Za-z]+>/g, ' ')
    .replace(/\[[^\]]+\]\[[^\]]*\]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`[^`]*`/g, (code) => ` code_${code.slice(1, -1).replace(/[^A-Za-z0-9]+/g, '_')} `)
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''))
    .filter((word) => word !== '')

/** Every run of `RUN` words two documents share, once per pair and first position. */
export const overlaps = (documents: ReadonlyArray<Document>, run: number = RUN): ReadonlyArray<Overlap> => {
  const runs = documents.map(({ path, content }) => {
    const words = proseWords(content)
    const at = new Map<string, number>()
    for (let i = 0; i + run <= words.length; i++) {
      const key = words.slice(i, i + run).join(' ')
      if (!at.has(key)) at.set(key, i)
    }
    return { path, words, at }
  })
  const found: Overlap[] = []
  for (const [index, first] of runs.entries()) {
    for (const second of runs.slice(index + 1)) {
      // Report each shared passage once: skip a run that starts inside the last one reported.
      let covered = -1
      const shared = [...first.at].filter(([key]) => second.at.has(key)).sort((a, b) => a[1] - b[1])
      for (const [, start] of shared) {
        if (start <= covered) continue
        let end = start + run
        while (end < first.words.length && shared.some(([, other]) => other === end - run + 1)) end++
        covered = end - 1
        found.push({ first: first.path, second: second.path, words: first.words.slice(start, end).join(' ') })
      }
    }
  }
  return found
}
