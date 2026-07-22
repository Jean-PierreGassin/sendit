/**
 * The stable selector keys for transfer engines: what `--engine=<id>` accepts
 * and what the saved default persists. Each engine's own `id` references this
 * map, so a literal like "airdrop" has exactly one home.
 */
export const EngineId = {
  airdrop: 'airdrop',
} as const;

export type EngineId = (typeof EngineId)[keyof typeof EngineId];

const ENGINE_IDS: readonly string[] = Object.values(EngineId);

export function isEngineId(value: string): value is EngineId {
  return ENGINE_IDS.includes(value);
}
