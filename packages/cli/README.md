# @sendit/cli

Send files from your terminal through pluggable transfer engines (AirDrop on macOS).

```sh
npx @sendit/cli ~/Pictures/holiday.jpg
npx @sendit/cli file-a.png file-b.pdf
```

## Install

```sh
npm i -g @sendit/cli
```

The `sendit` command is then available globally.

## Usage

```sh
sendit ~/photo.jpg           # send one or more files
sendit                       # no files: prompts to send the current directory
sendit --engine ~/photo.jpg  # pick the engine from a list
sendit --engine=airdrop ~/photo.jpg
sendit --default-engine=airdrop
```

## Requirements

- Node 24+
- macOS for the AirDrop engine

See the [project README](https://github.com/Jean-PierreGassin/sendit#readme) for engine docs and how to add your own.
