# Writing your own engine

`sendit` sends files through a **transfer engine**. AirDrop is the first one; this guide shows how to add another (Quick
Share, a LAN drop, an SFTP push, a test double) without touching the CLI's UI or argument handling.

The shared contract is the `TransferEngine` interface, defined in full in [engine-contract.md](./engine-contract.md) and
recapped below. AirDrop's own wire protocol ([engines/airdrop.md](./engines/airdrop.md)) is just how its Swift binary
talks to its wrapper: one engine's implementation detail, not a requirement.

## The interface

Every engine implements one TypeScript interface (`packages/cli/src/transfer/types/transfer-engine.ts`):

```ts
export interface TransferEngine {
  readonly id: string; // selector key for --engine, e.g. "airdrop"
  readonly name: string; // shown in the UI, e.g. "AirDrop"

  send(
    onStarted: TransferStartedListener,
    filePaths: string[],
  ): Promise<TransferResult>;
}
```

- `id` is the stable key `--engine=<id>` accepts and the saved default persists.
- `name` is how the transport appears in the spinner ("Sending 3 files via <name>").
- `send` receives absolute paths, calls `onStarted(files)` once the transfer begins, and resolves a `TransferResult`
  (`{ isSent: true }` or a failure from `createFailedTransfer(reason, code)`).

The reporter and CLI depend only on this interface, so a conforming engine needs no other wiring than being selected.

## Option A - in-process engine

Best when the transport has a Node-friendly API. Implement the interface directly:

```ts
// transfer/quick-share/lib/quick-share-engine.ts (its own engine folder)
export class QuickShareEngine implements TransferEngine {
  readonly id = 'quick-share';
  readonly name = 'Quick Share';

  async send(
    onStarted: TransferStartedListener,
    filePaths: string[],
  ): Promise<TransferResult> {
    onStarted(filePaths);
    // ...perform the transfer...
    return { isSent: true };
  }
}
```

## Option B - subprocess engine

Best when the transport needs a different language or a native binary (AirDrop's Swift engine is this shape).

1. Build a binary that takes file paths as argv and reports progress on stdout. Keep diagnostics on stderr.
2. Ship the binary in its own workspace package (mirror `packages/engines/macos/airdrop`).
3. Write an in-process engine that spawns the binary and turns its output into a `TransferResult`.

The wire format between your binary and its engine wrapper is yours to define; it is an implementation detail of your
engine, not a shared contract. The AirDrop engine uses a small NDJSON protocol
([engines/airdrop.md](./engines/airdrop.md)) with its own `parse-airdrop-engine-events.ts`; copy that shape if it fits,
or roll your own. `packages/cli/src/transfer/engines/airdrop/lib/airdrop-engine.ts` is the reference.

## Registering your engine

Engines are selected by `id` through the registry, so wiring one in is two edits:

1. Add its `id` to `EngineId` in `packages/cli/src/transfer/types/engine-id.ts`.
2. Map that id to a factory in `packages/cli/src/transfer/lib/engine-registry.ts`:

```ts
const ENGINE_FACTORIES: Record<EngineId, () => TransferEngine> = {
  [EngineId.airdrop]: () => new AirDropEngine(),
  [EngineId.quickShare]: () => new QuickShareEngine(),
};
```

`--engine=<id>`, the saved default, and the fallback all resolve through this map. Everything downstream stays the same.

## Implementation checklist

- [ ] Implements `TransferEngine` (`id` + `name` + `send`).
- [ ] Registered in `EngineId` and `engine-registry.ts`.
- [ ] Calls `onStarted` exactly once, when the transfer begins.
- [ ] Resolves `{ isSent: true }` on success; `createFailedTransfer(reason, code)` otherwise.
- [ ] Reuses the reporter's `reason` slugs where they fit.
- [ ] Subprocess engines: structured progress on stdout only, diagnostics on stderr.
- [ ] `pnpm lint`, `pnpm build`, and a real end-to-end send all pass.
