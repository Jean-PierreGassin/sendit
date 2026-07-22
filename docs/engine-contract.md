# AirDrop engine protocol

How the AirDrop engine's Swift binary (`packages/engines/macos/airdrop`) talks to the CLI: newline-delimited JSON on
stdout. This protocol is specific to the AirDrop engine; `transfer/engines/airdrop/lib/parse-airdrop-engine-events.ts`
parses exactly this shape.

The contract every engine shares is the `TransferEngine` TypeScript interface, **not** this wire format (see
[writing-an-engine.md](./writing-an-engine.md)). Another subprocess engine may adopt this NDJSON shape as a convenient
template or define its own; an in-process engine skips a wire format entirely and just implements the interface.

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

`reason` is a short, transport-neutral slug. Engines should reuse these where they fit; the CLI renders any unknown slug
as a generic failure.

| `reason`      | Meaning                                                      |
| ------------- | ------------------------------------------------------------ |
| `cancelled`   | User dismissed the transfer (AirDrop: `NSError` code `-128`) |
| `unavailable` | The transport cannot run for these items on this device      |
| `no-files`    | The engine was invoked with no paths                         |
| `failed`      | Any other transport failure; see `code`                      |

`engine-error` is synthesised by the CLI when the engine exits without emitting a terminal event; engines do not emit
it.

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
