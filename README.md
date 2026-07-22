# sendit

Send files from your terminal.

```sh
sendit ~/Pictures/holiday.jpg
sendit file-a.png file-b.pdf
```

Transfers run through pluggable engines. AirDrop (macOS) is the first; see [writing an engine](docs/writing-an-engine.md) to add more.

## Install

```sh
npm i -g sendit
```

The `sendit` package installs anywhere. The AirDrop engine executes on macOS (Apple Silicon) only; Node 24+ is required.

## Usage

Pick an engine per run:

```sh
sendit --engine=airdrop ~/photo.jpg
```

With no `--engine` and no saved default, sendit uses the only available engine and, after a successful send, offers to save it as your default. Once saved, future runs need no flag. Override any run with `--engine=<name>`, or edit `~/.config/sendit/config.json`.

## Run from source

```sh
pnpm install
pnpm build
node packages/cli/dist/index.js ~/photo.jpg
```

The AirDrop binary is committed and runs as-is. Rebuild it (needs the Swift toolchain) with `pnpm build:engine`.

## Docs

- [docs/engine-contract.md](docs/engine-contract.md) - the AirDrop engine's wire protocol.
- [docs/writing-an-engine.md](docs/writing-an-engine.md) - add your own engine.
