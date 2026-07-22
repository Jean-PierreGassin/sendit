import { styleText } from 'node:util';
import ora, { type Ora } from 'ora';
import type { TransferResult } from '../../transfer/types/transfer-result.js';

const GENERIC_FAILURE_MESSAGE = 'Transfer failed';

/**
 * Renders transfer progress and outcome with a spinner. Engine-agnostic: it
 * knows only the engine's display name and the v1 result, so any transport
 * (AirDrop, Quick Share, a test double) reports through it unchanged.
 */
export class TransferReporter {
  private readonly spinner: Ora = ora();

  constructor(private readonly engineName: string) {}

  reportStarted(fileCount: number): void {
    this.spinner.start(this.summarise('Sending', fileCount));
  }

  reportResult(result: TransferResult, fileCount: number): void {
    if (result.isSent) {
      this.spinner.succeed(this.summarise('Sent', fileCount));

      return;
    }

    this.spinner.fail(this.describeFailure(result.reason));
  }

  private summarise(verb: string, fileCount: number): string {
    const count = accent(describeFileCount(fileCount));
    const via = dim(`via ${this.engineName}`);

    return `${verb} ${count} ${via}`;
  }

  private describeFailure(reason: string): string {
    const messages: Record<string, string> = {
      cancelled: 'Cancelled',
      unavailable: `${this.engineName} is unavailable on this device`,
      'no-files': 'No files to send',
      'engine-error': `The ${this.engineName} engine could not be started`,
    };

    return messages[reason] ?? GENERIC_FAILURE_MESSAGE;
  }
}

function accent(text: string): string {
  return styleText('bold', text, { stream: process.stdout });
}

function dim(text: string): string {
  return styleText('dim', text, { stream: process.stdout });
}

function describeFileCount(fileCount: number): string {
  return fileCount === 1 ? '1 file' : `${fileCount} files`;
}
