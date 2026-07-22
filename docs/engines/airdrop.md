# AirDrop engine

One concrete engine. AirDrop satisfies the shared [engine contract](../engine-contract.md) by wrapping a Swift binary
(`packages/engines/macos/airdrop`); this page documents that binary's own wire protocol - newline-delimited JSON on
stdout, parsed by `transfer/engines/airdrop/lib/parse-airdrop-engine-events.ts`.

This protocol is **AirDrop's internal contract, not a shared one.** Nothing above the engine wrapper knows it exists;
the CLI only sees the `TransferEngine` interface. Another subprocess engine may borrow this NDJSON shape as a template or
define its own, and an in-process engine skips a wire format entirely (see [writing-an-engine.md](../writing-an-engine.md)).

## Transport

- The CLI spawns the engine with one argv entry per absolute file path.
- The engine writes newline-delimited JSON to **stdout**, one object per line. Nothing else may go to stdout.
- Diagnostics go to stderr, which the CLI inherits.
- The parser ignores any line it does not recognise, so extra event types can be added without breaking the CLI.

## Events

```text
{"event":"started","files":["/abs/a.jpg","/abs/b.png"]}
{"event":"complete"}
{"event":"failed","reason":"cancelled","code":-128}
```

| Event      | When                                        | Fields           |
| ---------- | ------------------------------------------- | ---------------- |
| `started`  | Once, when the share begins                 | `files`          |
| `complete` | Transfer accepted by the receiver; exit `0` | none             |
| `failed`   | Transfer failed or cancelled; exit non-zero | `reason`, `code` |

`code` is the underlying platform error code, or `0` when no error object exists.

## Failure reasons

The `reason` slugs and their meaning are defined once in the [engine contract](../engine-contract.md#failure-reasons).
AirDrop emits `cancelled`, `unavailable`, `no-files`, and `failed`; its only platform-specific mapping is `cancelled`,
which corresponds to `NSError` code `-128`. `code` carries the underlying `NSError` code, or `0` when none exists.

## Exit codes

| Code | Meaning                                     |
| ---- | ------------------------------------------- |
| `0`  | `complete` emitted                          |
| `1`  | `failed` emitted                            |
| `2`  | Internal error (event could not be encoded) |

## Non-goals

The AirDrop engine exposes no progress percentage, no headless recipient selection, and no "waiting for acceptance"
event, so the contract omits them rather than faking them. An engine with richer signals can add new `v`-guarded event
types without breaking existing CLIs.
