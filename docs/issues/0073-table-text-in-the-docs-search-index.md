# I73: Table text in the docs search index

Status: ready-for-agent

Category: enhancement

Found: 2026-10-03

## What

Table text may land poorly in the docs site's search index: on 2026-10-03 a search for "datom log" on a `docs:prod` build showed one result's text as "# Name Decision Why [D31 One datom log][D31]", a table's header and first cell run together. Find out whether this is a Pagefind setting (`data-pagefind-ignore` on table headers, or a custom excerpt) or how the site renders tables, and make a result from a table read well.

Split from [I27 The docs development server does not come up reliably, and has no search][I27], where it was the one question left open. No work done on it yet. Search runs only on a build: `pnpm docs:prod`.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D31]: ../plan/bootstrap/02-decision-log.md#d31
[I27]: 0027-docs-dev-server-unreliable-and-without-search.md
