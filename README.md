# sendit

Send files from your terminal.

```sh
sendit ~/Pictures/holiday.jpg
sendit file-a.png file-b.pdf
```

Transfers run through pluggable engines, currently supporting:

- AirDrop (macOS)

see [writing an engine](docs/writing-an-engine.md) to add more and help extend the list.

## Install

```sh
npm i -g sendit
```

## Requirements

- The `sendit` package installs anywhere
- Node 24+

## Usage

```sh
sendit ~/photo.jpg           # send one or more files
sendit                       # no files: prompts to send the current directory
sendit --engine ~/photo.jpg  # pick the engine from a list
sendit --engine=airdrop ~/photo.jpg
```

### Engines

- With no `--engine` and no saved default, sendit uses the only available engine and, after a successful send, offers to
  save it as your default. Once saved, future runs need no flag.
- `--engine=<name>` picks an engine for one run. Pass `--engine` with no name to choose from a list.
- `--default-engine[=<name>]` saves your default engine and exits; pass it without a name to choose from a list. This
  replaces editing `~/.config/sendit/config.json` by hand.

## Run from source

```sh
pnpm install
pnpm build
node packages/cli/dist/index.js ~/photo.jpg
```

The AirDrop binary is committed and runs as-is. Rebuild it (needs the Swift toolchain) with `pnpm build:engine`.

## Docs

- [docs/engine-contract.md](docs/engine-contract.md) - the contract every engine implements (the fundamentals).
- [docs/writing-an-engine.md](docs/writing-an-engine.md) - build and register your own engine.
- [docs/engines/airdrop.md](docs/engines/airdrop.md) - how the AirDrop engine is wired (its own wire protocol).
