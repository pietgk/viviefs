# ADR-0021: Files by content hash

Status: Qualified

Date: 2026-09-20

Qualifying gate: P09

Related: D43. [Architecture section 13](../plan/bootstrap/03-architecture.md).

## Problem

Putting bytes in the log couples durability to blob size. Putting provenance
only in object storage loses the audit trail. Uploads fail and retry; a
changeset must not become visible before the file exists on the server.

## Design

Files are stored by content hash (`blob:sha256...`): local file storage on
device, object storage on server. A datom references the hash. The upload is
an idempotent retryable activity. A changeset referencing a file commits only
once the file exists on the server (manifest extends to file references).

## Trade-offs

Bytes in object storage, provenance in the log. Content-hash names give
idempotent upload. The cost is that commit waits on the blob, which P09 must
show.

## Failure-handling

P06 includes a kill during content-hash upload. P09: a changeset that
references a file waits until that file exists on the server.

## Outcome

### Expected

No file bytes in the datom log. Retryable upload. Manifest includes file
references.

### Observed

2026-09-22. Ledger pass `2026-09-22T13-18-45.675Z-a314ca28`. The manifest names
`blob:` plus the sha256 hex. The peer does not see the file datom while the
blob is absent. After `PutBlob` the same changeset acks and the hash is
visible. The P09 store is in memory. Device files and object storage are later
implementations of `BlobStore`. Not Accepted. Evidence:
[2026-09-22-p09.md](../evidence/2026-09-22-p09.md).
