/**
 * The change from a problem file to its solution, line by line (D222), for a
 * lesson's "Your turn": the learner reviews the change instead of typing it.
 * A longest common subsequence of lines; files are short, so the quadratic
 * table is fine. Pure, so a test pins it.
 */

export type DiffLine = { readonly kind: 'same' | 'removed' | 'added'; readonly text: string }

export const lineDiff = (before: string, after: string): ReadonlyArray<DiffLine> => {
  const a = before.replace(/\n$/, '').split('\n')
  const b = after.replace(/\n$/, '').split('\n')
  // lengths[i][j]: the longest common subsequence of a[i..] and b[j..].
  const lengths = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const row = lengths[i] ?? []
      row[j] = a[i] === b[j] ? (lengths[i + 1]?.[j + 1] ?? 0) + 1 : Math.max(lengths[i + 1]?.[j] ?? 0, row[j + 1] ?? 0)
    }
  }
  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push({ kind: 'same', text: a[i] ?? '' })
      i++
      j++
    } else if (i < a.length && (j === b.length || (lengths[i + 1]?.[j] ?? 0) >= (lengths[i]?.[j + 1] ?? 0))) {
      // A removal before an addition, as diffs read.
      lines.push({ kind: 'removed', text: a[i] ?? '' })
      i++
    } else {
      lines.push({ kind: 'added', text: b[j] ?? '' })
      j++
    }
  }
  return lines
}

/** The diff in the form Expressive Code marks: `+` added, `-` removed, a space for a line both have. */
export const diffText = (lines: ReadonlyArray<DiffLine>): string =>
  lines.map(({ kind, text }) => `${kind === 'added' ? '+' : kind === 'removed' ? '-' : ' '}${text}`).join('\n')
