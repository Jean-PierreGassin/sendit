import type { TransferResult } from './transfer-result.js';

export type TransferStartedListener = (filePaths: string[]) => void;

/**
 * Transport that hands files to another device. AirDrop is one
 * implementation; any protocol (Quick Share, a network drop, a test double)
 * can satisfy this contract and slot into the CLI unchanged.
 */
export interface TransferEngine {
  /** Stable selector key for `--engine` and the saved default (e.g. "airdrop"). */
  readonly id: string;

  /** Human name for the transport, shown in the UI (e.g. "AirDrop"). */
  readonly name: string;

  send(
    onStarted: TransferStartedListener,
    filePaths: string[],
  ): Promise<TransferResult>;
}
