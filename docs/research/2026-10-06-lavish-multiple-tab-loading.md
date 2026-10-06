# Recovering Lavish when several review tabs are open

Operational research record, 2026-10-06. This records a reproduced loading
failure and a host-tool update. It does not change the glossary presentations
or establish a reader-comprehension result.

## Report and reproduction

The user reported that the [combined glossary review](2026-10-06-glossary-k-plex-combined.md)
hung on a blank page. The installed Lavish was `0.1.43`. A single review usually
loaded, including at 390px, 800px and 1440px. A temporary "Checking layout" delay
at 800px eventually cleared; that was not sufficient evidence of the permanent
failure.

The sharper browser reproduction exercised the actual artifact-loading path:

1. Open the existing review in an isolated Chrome session. Its page holds one
   persistent `/events/<session>` connection.
2. Confirm an uncached artifact fetch succeeds with HTTP 200.
3. Open five additional event streams on the same origin in that browser.
4. Attempt the same uncached artifact fetch with a two-second abort deadline.
5. Close the five temporary streams in a `finally` block.

The result was reproducible:

```json
{"pass":false,"baseline":200,"extraLiveStreams":5,"resourceBlocked":"AbortError"}
```

A seventh real review tab also failed to navigate while six review tabs held
their streams. The temporary connection probe was kept in the ignored
`.lavish/glossary-kplex-combined/debug/` directory rather than added as a
production repository test.

## Cause and recovery

The old per-tab server-sent event transport occupies the browser's HTTP
connection pool. Ordinary page, artifact and feedback requests then wait for a
connection. The [upstream fix, PR 324](https://github.com/kunchenguid/lavish-axi/pull/324)
replaces persistent event streams with WebSocket connections and includes
migration for already-open legacy tabs. It shipped in `0.1.65`, according to
[the upstream changelog](https://github.com/kunchenguid/lavish-axi/blob/main/CHANGELOG.md).

The existing host installation was updated from `0.1.43` to exactly `0.1.82`
using npm with its existing `/Users/grop/.local` prefix. Opening the combined
review with that binary replaced the old server. `/health` then reported
`0.1.82` on the original port, 4387, and the review retained its original URL.
The interrupted feedback polls were restarted with the updated binary.

## Validation

Seven distinct copies of the actual glossary artifact were opened together
against an isolated updated server and state directory on port 4497. All seven
exposed the Explainer and glossary controls in Chrome's accessibility tree,
cleared the loading overlay, and rendered visible frames. Reloading the first
review with all seven still open also passed. A screenshot was inspected.
The private test server and its review tabs were then stopped and closed.

The real combined review was also checked on port 4387 after replacement: it
rendered its content, cleared the layout check and had an attached feedback
listener. The combined research HTML retained SHA-256
`62dbccec9ad6a455285d51e453ad53dc7c74b89b7a5a994092a118278b2e1cb3`.
The initial and combined presentation records were not rewritten.
`mise exec -- pnpm verify` passed the docs-only checks: docs, diagrams and guides.

For a future recurrence, check the running server version as well as the CLI
version. A tool update is not in effect until its server has been replaced.
Reproduce with several review tabs, since a single-tab check can miss this
failure. Preserve queued feedback and drafts during recovery; do not delete
session state or end research sessions merely to free browser connections.
