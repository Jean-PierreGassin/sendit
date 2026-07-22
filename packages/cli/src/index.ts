#!/usr/bin/env node
import { resolve } from 'node:path';
import { Command } from 'commander';
import { loadConfig, saveDefaultEngine } from './config/lib/config-store.js';
import { offerToSaveDefaultEngine } from './config/lib/offer-default-engine.js';
import { confirm } from './prompt/lib/confirm.js';
import { pickEngineId } from './transfer/lib/engine-picker.js';
import {
  availableEngineIds,
  createEngine,
  fallbackEngineId,
} from './transfer/lib/engine-registry.js';
import { EngineId, isEngineId } from './transfer/types/engine-id.js';
import { TransferReporter } from './reporting/lib/transfer-reporter.js';

const EXIT_TRANSFER_FAILED = 1;
const EXIT_BAD_USAGE = 2;

/**
 * A `--engine`/`--default-engine` value as Commander yields it: `true` when the
 * flag is passed bare (open the picker), or the given name as a string.
 */
type EngineFlag = string | true;

interface RunOptions {
  engine?: EngineFlag;
  defaultEngine?: EngineFlag;
}

/**
 * Entry point for every invocation. `--default-engine` is a management action
 * that saves and exits; otherwise we resolve the engine (flag, picker, or saved
 * default) and the files to send (falling back to the current directory), then
 * hand off to the transfer.
 */
async function run(files: string[], options: RunOptions): Promise<void> {
  const config = await loadConfig();

  if (options.defaultEngine !== undefined) {
    await saveDefaultEngineChoice(options.defaultEngine, config.defaultEngine);

    return;
  }

  const engineId = await resolveEngineId(options.engine, config.defaultEngine);
  if (engineId === undefined) {
    return;
  }

  const filePaths = await resolveFilePaths(files);
  if (filePaths === undefined) {
    return;
  }

  await sendFiles(engineId, filePaths, config.defaultEngine);
}

/**
 * Absolute paths for the files to send. With no arguments we offer to send the
 * current directory; declining (or a non-interactive stdin with nothing to
 * send) resolves undefined so the caller stops without starting a transfer.
 */
async function resolveFilePaths(
  files: string[],
): Promise<string[] | undefined> {
  if (files.length > 0) {
    return files.map((file) => resolve(file));
  }

  return resolveCurrentDirectory();
}

async function resolveCurrentDirectory(): Promise<string[] | undefined> {
  if (!process.stdin.isTTY) {
    process.stderr.write(
      'No files to send. Pass one or more paths, e.g. `sendit file.jpg`.\n',
    );
    process.exitCode = EXIT_BAD_USAGE;

    return undefined;
  }

  const currentDirectory = process.cwd();
  const shouldSend = await confirm(
    `Send the current directory (${currentDirectory})?`,
    false,
  );
  if (!shouldSend) {
    process.stdout.write('Nothing sent.\n');

    return undefined;
  }

  return [currentDirectory];
}

/**
 * Chooses the engine for this run: a named flag or bare `--engine` picker when
 * given, otherwise the saved default and finally the fallback. Resolves
 * undefined when an explicit selection fails or is cancelled.
 */
async function resolveEngineId(
  engineFlag: EngineFlag | undefined,
  savedDefault: EngineId | undefined,
): Promise<EngineId | undefined> {
  if (engineFlag === undefined) {
    return savedDefault ?? fallbackEngineId();
  }

  return resolveEngineFlag(engineFlag, 'Which engine should send these files?');
}

/**
 * Resolves an explicit engine flag: `true` opens the picker, a string is
 * validated against the registry. Reports the reason and resolves undefined
 * when nothing is chosen.
 */
async function resolveEngineFlag(
  engineFlag: EngineFlag,
  pickerQuestion: string,
): Promise<EngineId | undefined> {
  if (engineFlag === true) {
    const pickedId = await pickEngineId(pickerQuestion);
    if (pickedId === undefined) {
      reportNoEngineChosen();
    }

    return pickedId;
  }

  if (isEngineId(engineFlag)) {
    return engineFlag;
  }

  reportUnknownEngine(engineFlag);

  return undefined;
}

/**
 * Saves the default engine named by `--default-engine`, then returns; this run
 * sends nothing. A no-op with a friendly note when the choice already is the
 * saved default.
 */
async function saveDefaultEngineChoice(
  engineFlag: EngineFlag,
  savedDefault: EngineId | undefined,
): Promise<void> {
  const engineId = await resolveEngineFlag(
    engineFlag,
    'Which engine should be your default?',
  );
  if (engineId === undefined) {
    return;
  }

  const engineName = createEngine(engineId).name;
  if (engineId === savedDefault) {
    process.stdout.write(`${engineName} is already your default engine.\n`);

    return;
  }

  await saveDefaultEngine(engineId);
  process.stdout.write(
    `Saved ${engineName} as your default. Override any run with --engine=<name>.\n`,
  );
}

async function sendFiles(
  engineId: EngineId,
  filePaths: string[],
  savedDefault: EngineId | undefined,
): Promise<void> {
  const engine = createEngine(engineId);
  const reporter = new TransferReporter(engine.name);

  const result = await engine.send(() => {
    reporter.reportStarted(filePaths.length);
  }, filePaths);
  reporter.reportResult(result, filePaths.length);

  if (!result.isSent) {
    process.exitCode = EXIT_TRANSFER_FAILED;

    return;
  }

  await offerToSaveDefaultEngine(engineId, engine.name, savedDefault);
}

function reportUnknownEngine(engineFlag: string): void {
  const availableEngines = availableEngineIds().join(', ');
  process.stderr.write(
    `Unknown engine "${engineFlag}". Available: ${availableEngines}\n`,
  );
  process.exitCode = EXIT_BAD_USAGE;
}

function reportNoEngineChosen(): void {
  const availableEngines = availableEngineIds().join(', ');
  process.stderr.write(
    `No engine selected. Use --engine=<name>. Available: ${availableEngines}\n`,
  );
  process.exitCode = EXIT_BAD_USAGE;
}

const program = new Command();
program
  .name('sendit')
  .description('Send files from the terminal')
  .argument('[files...]', 'files to send (defaults to the current directory)')
  .option(
    '-e, --engine [name]',
    'engine to use; pass the flag without a name to choose from a list',
  )
  .option(
    '--default-engine [name]',
    'save your default engine and exit; pass without a name to choose from a list',
  )
  .action(run);

await program.parseAsync();
