#!/usr/bin/env node
import { resolve } from 'node:path';
import { Command } from 'commander';
import { loadConfig } from './config/lib/config-store.js';
import { offerToSaveDefaultEngine } from './config/lib/offer-default-engine.js';
import {
  availableEngineIds,
  createEngine,
  fallbackEngineId,
} from './transfer/lib/engine-registry.js';
import { EngineId, isEngineId } from './transfer/types/engine-id.js';
import { TransferReporter } from './reporting/lib/transfer-reporter.js';

const EXIT_TRANSFER_FAILED = 1;
const EXIT_BAD_USAGE = 2;

interface TransferOptions {
  engine?: string;
}

async function runTransfer(
  filePaths: string[],
  options: TransferOptions,
): Promise<void> {
  const config = await loadConfig();
  const selectedId = resolveEngineId(options.engine, config.defaultEngine);
  if (selectedId === undefined) {
    reportUnknownEngine(options.engine);

    return;
  }

  const absolutePaths = filePaths.map((filePath) => resolve(filePath));
  const engine = createEngine(selectedId);
  const reporter = new TransferReporter(engine.name);

  const result = await engine.send(() => {
    reporter.reportStarted(absolutePaths.length);
  }, absolutePaths);
  reporter.reportResult(result, absolutePaths.length);

  if (!result.isSent) {
    process.exitCode = EXIT_TRANSFER_FAILED;

    return;
  }

  await offerToSaveDefaultEngine(selectedId, engine.name, config.defaultEngine);
}

/**
 * Chooses the engine for this run: the `--engine` flag when valid, else the
 * saved default, else the fallback engine. Returns undefined only when the
 * flag names an engine that does not exist.
 */
function resolveEngineId(
  engineFlag: string | undefined,
  savedDefault: EngineId | undefined,
): EngineId | undefined {
  if (engineFlag === undefined) {
    return savedDefault ?? fallbackEngineId();
  }
  if (!isEngineId(engineFlag)) {
    return undefined;
  }

  return engineFlag;
}

function reportUnknownEngine(engineFlag: string | undefined): void {
  const known = availableEngineIds().join(', ');
  process.stderr.write(`Unknown engine "${engineFlag}". Available: ${known}\n`);
  process.exitCode = EXIT_BAD_USAGE;
}

const program = new Command();
program
  .name('sendit')
  .description('Send files from the terminal')
  .argument('<files...>', 'files to send')
  .option('-e, --engine <name>', 'transfer engine to use')
  .action(runTransfer);

await program.parseAsync();
