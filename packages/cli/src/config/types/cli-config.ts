import type { EngineId } from '../../transfer/types/engine-id.js';

/** Persisted CLI preferences, read on every run and written on opt-in. */
export interface CliConfig {
  defaultEngine?: EngineId;
}
