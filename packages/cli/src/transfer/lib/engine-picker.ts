import { selectOption } from '../../prompt/lib/select-option.js';
import { EngineId } from '../types/engine-id.js';
import { availableEngineIds, createEngine } from './engine-registry.js';

/**
 * Prompts for one of the installed engines and returns its id. When only one
 * engine exists there is nothing to choose, so it is returned without a menu.
 * Resolves undefined when the user cancels or stdin is non-interactive.
 */
export async function pickEngineId(
  question: string,
): Promise<EngineId | undefined> {
  const engineIds = availableEngineIds();
  const [onlyEngineId] = engineIds;
  if (engineIds.length === 1 && onlyEngineId !== undefined) {
    return onlyEngineId;
  }

  const options = engineIds.map((engineId) => ({
    value: engineId,
    label: createEngine(engineId).name,
  }));

  return selectOption(question, options);
}
