# IntentComposer

**IntentComposer** is the pattern name. This page is `intent-composer.md`.

## States

```mermaid
stateDiagram-v2
  [*] --> empty
  empty --> composing: start
  composing --> reviewing: candidate(hash)
  composing --> empty: cancel
  reviewing --> composing: retake
  reviewing --> empty: cancel
  reviewing --> submitting: confirm
  submitting --> empty: command ok
  submitting --> reviewing: command fail
```

## Confirm

Confirm follows the effect-machine path. After success a command may mint a changeset. The composer is already empty.

```mermaid
sequenceDiagram
  participant Button as Confirm button
  participant Session as ComposerSession
  participant Machine as effect-machine
  participant Submit as submit Effect
  Button->>Session: send(Confirm)
  Session->>Machine: runFork(ref.send(Confirm))
  Note over Session,Machine: send is async enqueue
  Machine->>Machine: reviewing to submitting
  Machine->>Submit: invoke submit
  Submit-->>Machine: onDone or onFailure
  Machine->>Session: changes stream
  Note over Session: empty, or reviewing with the same candidateHash
```
