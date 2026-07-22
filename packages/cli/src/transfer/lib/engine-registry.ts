import { AirDropEngine } from '../engines/airdrop/lib/airdrop-engine.js';
import { EngineId } from '../types/engine-id.js';
import type { TransferEngine } from '../types/transfer-engine.js';

/**
 * Maps each selector id to the engine that serves it. Adding an engine is one
 * entry here plus its id in `EngineId`; the CLI, `--engine`, and the saved
 * default all read from this registry.
 */
const ENGINE_FACTORIES: Record<EngineId, () => TransferEngine> = {
  [EngineId.airdrop]: () => new AirDropEngine(),
};

export function createEngine(id: EngineId): TransferEngine {
  return ENGINE_FACTORIES[id]();
}

export function availableEngineIds(): EngineId[] {
  return Object.values(EngineId);
}

/**
 * The engine used when a run names none and no default is saved. The first
 * registered engine wins, so a single-engine install just works.
 */
export function fallbackEngineId(): EngineId {
  const [firstEngineId] = availableEngineIds();

  return firstEngineId ?? EngineId.airdrop;
}
