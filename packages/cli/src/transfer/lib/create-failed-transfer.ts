import type { FailedTransfer } from '../types/transfer-result.js';

/**
 * Builds a failed transfer so the shape and its invariants live in one
 * place.
 */
export function createFailedTransfer(
  reason: string,
  code: number,
): FailedTransfer {
  return { isSent: false, reason, code };
}
