# K-Plex, simply explained

Recorded 2026-10-06. Open the [interactive explainer](2026-10-06-k-plex-explained.html)
for a small map around one idea, with everyday and software examples. It is
intended for engineers and people outside software. The user liked this version
and asked to keep it as research for future sessions.

## What the map explains

- **Focus**: the middle node is the note or idea you are looking at.
- **Parent and children**: the bigger context above and the smaller parts below.
  In these examples, a child is part of its parent. Parent and child are inverse
  views of the same relationship.
- **Siblings**: distinct nodes sharing a parent. Their connection is derived
  through that parent, rather than requiring a separate sibling link.
- **Previous and next**: before and after in a chosen sequence, separate from
  grouping and from browsing history.

The everyday example centres on cooking pasta; the software example centres on
testing a release. Solid lines show grouping, and dashed arrows show sequence.
The controls switch examples or highlight one relationship with a short
explanation. Expand the engineer details for directed graph examples, inverse
relationships and the possibility of multiple parents.

## Sources and limits

The explainer cites [K-Plex's documented relationship regions](https://github.com/zsviczian/kplex#why-k-plex).
It is a simplified illustration, not the actual K-Plex plugin or a complete
account of its relationship types. Clicking a node to make it the new centre
is described, but is not implemented in this illustration. The software example
is illustrative, not a validated release workflow for this repository.

For the earlier source investigation, release-specific findings and isolated
Obsidian trial context, read [K-Plex and concept navigation](2026-10-02-k-plex-concept-navigation.md)
and its [visual research record](2026-10-02-k-plex-concept-navigation.html).
Preserving this explainer does not refresh those findings or validate plugin
behaviour. This is a research record under D68, not qualification evidence or
the source of a guide's claims.

## Preservation and provenance

The HTML was created on 2026-10-06 in Codex session
`01a11074-87e7-7f11-973c-35d0b7f5c507`. That session was archived after interaction
became unavailable. During preservation, the original worktree file was absent;
its complete content survived in the archived session's successful `FileChange`
addition record at line 89.

Original location and local recovery record:

```text
/Users/grop/.codex/worktrees/a6f4/viviefs/.lavish/k-plex-explained/index.html
/Users/grop/.codex/archived_sessions/rollout-2026-10-06T11-03-54-01a11074-87e7-7f11-973c-35d0b7f5c507.jsonl
```

The preserved HTML is byte-for-byte identical to that record: 17,394 UTF-8
bytes, with SHA-256:

```text
06615550be8bb14caa142aaa0099f1ccea8aeefa5de45905bfd89f99a46cae07
```

Its styles, diagram and interaction scripts are embedded. The page uses the
existing ViViEfs Starlight palette and system typography; viewing it needs
neither the original worktree nor a Lavish server. Its only external link is
the cited K-Plex documentation. The docs site serves this HTML unchanged and
renders this companion as a searchable page. Future sessions can start at the
[research index](README.md) and use these tracked records without the session
archive.
