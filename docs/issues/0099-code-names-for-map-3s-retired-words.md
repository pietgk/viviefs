# I99: Code names for map 3's retired words

Status: ready-for-agent

Category: enhancement

Found: 2026-10-28

## What

Rename the code identifiers that still use a word [I91 Effect's names against ours][I91] retired as our term, and [P17 Browser engine leader][P17]'s name, so code and prose say the same compound ([D197 Evidence registry, and the code names follow in one issue][D197], [D173 What a word change rewrites, and where it is written][D173]). In phase 3's qualification batch, beside [I61 Rename evidence-mobile to evidence-client][I61]'s rename, since `tools/qualification` and most of `libs/` are gate inputs.

Rename, choosing each new name here (the review page's examples: `WorkflowEngineConfig`, `completeDurableDeferred`, `readSyncCursor`, `EvidenceRegistryEntry`):

- workflow engine ([D186 Workflow engine and workflow runner][D186]): `EngineConfig`, `EngineSweep` (`libs/workflow-engine`).
- durable deferred ([D187 Durable deferred][D187]): `completeDeferred` (`libs/workflow-engine/src/engine.ts`), `scheduleDeferredNotification` and `DeferredNotificationData` (`libs/platform-native/src/notifications.ts`, `apps/evidence-client/src/p07-runtime.ts`), `serverDeferred` (`tools/qualification/src/probes/p09-checks.ts`).
- changeset manifest ([D192 Changeset manifest][D192]): `CommitManifest` (`libs/datom/src/manifest.ts`, `projector.ts`; the commit datom's value, the changeset manifest and the basis), `fileManifest` (`p09-checks.ts`).
- sync cursor ([D193 Sync cursor][D193]): `readCursor`, `writeCursor`, `CursorRow` (`libs/sync/client/src/client.ts`). `Cursor` in `libs/datom` and the trace projector, and the projector's `loadCursor` and `saveCursor`, are any consumer's acknowledged cursor, not a sync cursor: check each before renaming.
- evidence registry ([D197 Evidence registry, and the code names follow in one issue][D197]): `RegistryEntry`, `RegistryContext` (`tools/verify`).
- [P17 Browser engine leader][P17]: "Browser engine leader" becomes "Workflow engine leader in a browser", and its claim "Only one tab runs the engine" says "workflow engine", in `tools/qualification/src/gates.ts` and the gate table together (`verify`'s `guides` step checks that the two claims match) ([D186 Workflow engine and workflow runner][D186]); it has never run, so no ledger entry has the name. [D25 Browser engine leader][D25] keeps its name.

Pinned names stay ([D44 Never rename, never migrate][D44], [D44' Never rename, never migrate, the RPC too][D44']): `viviefs/deferred/exit`, the RPC `CompleteDeferred`, the RPC error `ManifestRejected`, the sync RPC's `cursor` fields, the `manifest` column of `changesets`, the envelope's `actor`. Every `Worker` in code is a web worker thread, the sense left to the bare word, and stays.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D173]: ../plan/bootstrap/02-decision-log.md#d173
[D186]: ../plan/bootstrap/02-decision-log.md#d186
[D187]: ../plan/bootstrap/02-decision-log.md#d187
[D192]: ../plan/bootstrap/02-decision-log.md#d192
[D193]: ../plan/bootstrap/02-decision-log.md#d193
[D197]: ../plan/bootstrap/02-decision-log.md#d197
[D25]: ../plan/bootstrap/02-decision-log.md#d25
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[D44']: ../plan/bootstrap/02-decision-log.md#d44p
[I61]: 0061-rename-evidence-mobile-to-evidence-client.md
[I91]: 0091-effects-names-against-ours.md
[P17]: ../plan/bootstrap/06-qualification-gates.md#p17
