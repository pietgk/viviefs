# I32: Ideas batch: explain any word on demand

Status: needs-triage

Category: enhancement

Found: 2026-10-04

Series: ideas-batch, sixth batch: `ideas-batch-explain-any-word-on-demand`

## What

Let a reader point at any word on a docs page and get an explanation when one exists, found when the reader asks for it in the browser instead of written into every page when the site is built, so the build does less, the page is not blue with links, and the explanation can lead on to more detail. It came from the slow docs build (I27): perhaps not all of the term and reference work has to happen at build time. It is the same gesture as selecting a word and asking a dictionary or a translator. This issue does not decide anything.

## How it works today

- **At build time** (`apps/docs/src/lib/reference-links.ts`, D87, D90, D94): every page is scanned for gate, ADR, decision and issue ids, inline-code paths and glossary terms. Each one found becomes a link that carries its kind, name and one-line summary as `data-ref-*` data on the link. An unknown id or a missing path fails the build.
- **Only the first use** of a glossary term on a page is linked (D94), so a page does not turn blue with links; later uses get nothing.
- **In the browser** (`apps/docs/src/components/MarkdownContent.astro`): hovering a reference link for 120 ms, or focusing it with the keyboard, shows a card with what the build wrote into the link. Nothing else on the page can show a card.
- **Words in another sense** get the glossary's meaning anyway (I26), because the build decides once, without the reader.

## The idea

- **Any word can be asked about.** The reader points at a word (hover, or select it, or a keyboard or touch gesture), and the page looks it up then: a glossary term, a decision or gate name, an issue, a path, a pattern. If something explains it, a card appears; if not, nothing happens. Most of the time a reader points at a word because they want it explained, and those are mostly the words that have an explanation.
- **Lazy, not built in.** The page carries plain text. The lookup runs in the browser against an index the site publishes once (terms, their forms and plurals, ids, names), and the explanation is fetched only for the word asked about. The build writes the index once instead of every link on every page.
- **No blue page.** Nothing has to be a link for the card to work, so the "first use only" rule can go, or stay only for the words a page wants to stress.
- **The card leads further.** It shows the plain sentence and then links into more detail as fits: the glossary paragraph, the effect form proposed in I30, the decision, the guide, the code, the evidence.
- **Like a dictionary or a translator.** Selecting a word and asking for its meaning or its translation is a gesture readers know; this is the same gesture with the stack's own vocabulary first, and perhaps a general dictionary after it.

## What it could solve, and what it moves

- **Build time (I27).** The term finder runs over every text node of every page today. Whether it is a large part of the 100-120 seconds is not measured yet; measure it before moving it.
- **Words in another sense (I26).** A lookup at the moment a reader asks can look at the sentence around the word, the page, or ask the reader which sense they mean, which a build-time link cannot.
- **What the build still has to check.** An unknown id or a missing path fails the build today (D87), and that check is worth keeping: a lazy lookup must not turn a broken reference into a card that silently shows nothing. The check and the linking could be split: the build checks, the browser explains.
- **Agents and `llms.txt`.** An agent reads the Markdown sources or `llms.txt`, not the hover. Explanations that live only behind a hover must still be reachable as text.

## Questions for the brainstorm

- **What is the thing called?** A word that has an explanation: a term, a name, a reference, an entry? It needs a glossary name of its own (I30).
- **How is it asked for?** Hover alone fires on every word the pointer passes. A short delay, a modifier key, a selection, a long press on a phone, keyboard focus: which ones, so it works for touch and for keyboard and screen-reader users, not only for a mouse?
- **How does a reader know a word has an explanation** without a link: no sign at all, a quiet underline that appears on hover, or a mode the reader turns on?
- **What is looked up, and from where?** One published index of terms, ids and names, built with the site; the explanation fetched per word, or shipped with the page because it is small?
- **Which sense?** When a word is a term here and means something else nearby (I26), does the card pick by context, show both, or ask?
- **Beyond our own words.** Does the card fall back to a general dictionary or a translation for words that are not ours, and is that worth it in a reference stack?
- **What stays at build time?** The checks for unknown ids and missing paths, the links a page wants to stress, and anything an agent reading the source needs.

## Comments
