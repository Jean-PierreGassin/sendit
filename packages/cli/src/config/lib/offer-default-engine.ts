import { EngineId } from '../../transfer/types/engine-id.js';
import { confirm } from '../../prompt/lib/confirm.js';
import { configFilePath, saveDefaultEngine } from './config-store.js';

/**
 * After a successful send, offers to persist the engine just used as the
 * default so future runs need no `--engine`. Prompts only when the choice
 * would change something: no default yet (opt in by default), or an explicit
 * engine that differs from the saved default (opt in only if asked for).
 * A no-op once the selected engine already is the default.
 */
export async function offerToSaveDefaultEngine(
  selectedId: EngineId,
  engineName: string,
  savedDefault: EngineId | undefined,
): Promise<void> {
  const isFirstDefault = savedDefault === undefined;
  if (selectedId === savedDefault) {
    return;
  }

  const question = isFirstDefault
    ? `Set ${engineName} as your default engine?`
    : `Make ${engineName} your default engine instead?`;

  const shouldSave = await confirm(question, isFirstDefault);
  if (!shouldSave) {
    return;
  }

  await saveDefaultEngine(selectedId);
  process.stdout.write(
    `Saved ${engineName} as your default. ` +
      `Override any run with --engine=<name>, or edit ${configFilePath}.\n`,
  );
}
