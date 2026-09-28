/**
 * The span-review convention (P09, P10, P11): an evidence note carries a
 * picture drawn from the probe's spans between two markers, and the probe
 * fails when a later run draws a different one. The picture is regenerated
 * from the probe, never edited by hand.
 */
import { readFileSync } from 'node:fs'

const START = '<!-- span-review:start -->'
const END = '<!-- span-review:end -->'

export const recordedSpanReview = (markdown: string): string | undefined => {
  const start = markdown.indexOf(START)
  const end = markdown.indexOf(END)
  if (start < 0 || end < 0 || end < start) return undefined
  return markdown.slice(start + START.length, end).trim()
}

/** Undefined when the note holds `actual`; otherwise what to do about it. */
export const spanReviewDrift = (
  gate: string,
  actual: string,
  markdown: string,
): string | undefined => {
  const recorded = recordedSpanReview(markdown)
  const drawn = actual.trim()
  if (recorded === drawn) return undefined
  return recorded === undefined
    ? `${gate} span review markers missing. Insert this between ${START} and ${END}:\n${drawn}`
    : `${gate} span review drifted from the probe:\n${drawn}`
}

/**
 * The comment on one check in a checks file: the block that follows a
 * `<marker> <fn>` line, as one paragraph, with the line it starts on.
 */
export const checkNote = (
  source: string,
  marker: string,
  fn: string,
): { readonly line: number; readonly text: string } => {
  const lines = readFileSync(source, 'utf8').split('\n')
  const at = lines.findIndex((line) => line.includes(`${marker} ${fn}`))
  if (at < 0) return { line: 1, text: `missing note for ${fn}` }
  const body: Array<string> = []
  for (let index = at + 1; index < lines.length; index++) {
    const line = lines[index] ?? ''
    if (line.trim() === '*/') break
    body.push(line.replace(/^\s*\*\s?/, ''))
  }
  return {
    line: at + 1,
    text: body.join(' ').replaceAll(/\s+/g, ' ').trim(),
  }
}
