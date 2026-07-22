import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { EngineId, isEngineId } from '../../transfer/types/engine-id.js';
import type { CliConfig } from '../types/cli-config.js';

const CONFIG_DIR = join(
  process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'),
  'sendit',
);
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/** Human-facing location of the config, shown when the default is saved. */
export const configFilePath = CONFIG_FILE;

/**
 * Reads saved preferences, treating a missing, unreadable, or malformed file
 * as "no preferences" so a bad config never blocks a send.
 */
export async function loadConfig(): Promise<CliConfig> {
  const raw = await tryReadConfigFile();

  return { defaultEngine: readDefaultEngine(raw) };
}

export async function saveDefaultEngine(
  defaultEngine: EngineId,
): Promise<void> {
  const config: CliConfig = { ...(await loadConfig()), defaultEngine };

  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`);
}

async function tryReadConfigFile(): Promise<unknown> {
  try {
    return JSON.parse(await readFile(CONFIG_FILE, 'utf8'));
  } catch {
    return undefined;
  }
}

function readDefaultEngine(raw: unknown): EngineId | undefined {
  if (
    !isRecord(raw) ||
    typeof raw.defaultEngine !== 'string' ||
    !isEngineId(raw.defaultEngine)
  ) {
    return undefined;
  }

  return raw.defaultEngine;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
