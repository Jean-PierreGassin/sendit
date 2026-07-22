# Engine contract

Every transfer engine - AirDrop today, a future Quick Share, a LAN drop, an SFTP push, a test double - satisfies the
same contract: the `TransferEngine` TypeScript interface. That interface is the **only** thing the CLI depends on. How
an engine talks to a binary, a network, or a native API underneath is its own concern and never leaks up to the CLI
(AirDrop's own wire protocol is documented separately in [engines/airdrop.md](./engines/airdrop.md)).

This page is the reference for the shared contract. To actually build and register an engine, follow
[writing-an-engine.md](./writing-an-engine.md).

## The interface

`packages/cli/src/transfer/types/transfer-engine.ts`:

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
- `send` receives absolute paths, calls `onStarted(files)` once the transfer begins, and resolves a `TransferResult`.

The reporter and CLI depend only on this interface, so a conforming engine needs no wiring beyond being registered.

## Result

`send` resolves one of two shapes (`transfer/types/transfer-result.ts`):

- Success: `{ isSent: true }`.
- Failure: `createFailedTransfer(reason, code)`, which returns `{ isSent: false, reason, code }`.

`onStarted` must fire **exactly once**, when the transfer actually begins, so the reporter can start its spinner. For an
immediate failure (an unsupported platform, no files) resolve a failure result without ever calling `onStarted`.

## Failure reasons

`reason` is a short, transport-neutral slug. The reporter maps these to messages; reuse them where they fit, and any
slug it does not recognise renders as a generic failure.

| `reason`      | Meaning                                                 |
| ------------- | ------------------------------------------------------- |
| `cancelled`   | User dismissed the transfer                             |
| `unavailable` | The transport cannot run for these items on this device |
| `no-files`    | The engine was invoked with no paths                    |
| `failed`      | Any other transport failure; see `code`                 |

`code` is the underlying platform error code, or `0` when none applies. Engines emit the slugs above; the CLI itself
synthesises one more, `engine-error`, when a subprocess engine exits without ever resolving a terminal result. Engines
never emit `engine-error`.

## Selection

Engines are chosen by `id` through the registry (`transfer/lib/engine-registry.ts`). `--engine=<id>`, the bare
`--engine` / `--default-engine` picker, the saved default, and the single-engine fallback all resolve through that one
map, so nothing downstream cares which engine ran. Registering an engine is covered in
[writing-an-engine.md](./writing-an-engine.md).
