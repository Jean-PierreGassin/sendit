import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFailedTransfer } from '../../../lib/create-failed-transfer.js';
import { parseAirDropEngineEvent } from './parse-airdrop-engine-events.js';
import { AirDropEventType } from '../types/airdrop-event.js';
import { EngineId } from '../../../types/engine-id.js';
import type {
  TransferEngine,
  TransferStartedListener,
} from '../../../types/transfer-engine.js';
import type { TransferResult } from '../../../types/transfer-result.js';

const SUPPORTED_PLATFORM = 'darwin';
const UNSUPPORTED_PLATFORM_CODE = 0;

/** Where the committed Swift binary lives inside its workspace package. */
interface EngineBinary {
  package: string;
  subpath: string;
  spawnFailedCode: number;
}

const ENGINE_BINARY: EngineBinary = {
  package: '@sendit/airdrop',
  subpath: 'Core/AirDrop/bin/airdrop',
  spawnFailedCode: -1,
};

type TransferResolver = (result: TransferResult) => void;

/**
 * Drives the committed Swift AirDrop binary over its NDJSON protocol. The
 * binary owns Apple's recipient picker and waits indefinitely for the user,
 * so `send` settles only once the transfer succeeds, fails, is cancelled, or
 * the binary never runs.
 */
export class AirDropEngine implements TransferEngine {
  readonly id = EngineId.airdrop;
  readonly name = 'AirDrop';

  async send(
    onStarted: TransferStartedListener,
    filePaths: string[],
  ): Promise<TransferResult> {
    if (process.platform !== SUPPORTED_PLATFORM) {
      return createFailedTransfer('unavailable', UNSUPPORTED_PLATFORM_CODE);
    }

    const engine = spawn(resolveEngineBinaryPath(), filePaths, {
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    const engineOutput = createInterface({ input: engine.stdout });

    return new Promise((resolveResult) => {
      engineOutput.on('line', (line) => {
        applyEngineEvent(line, onStarted, resolveResult);
      });
      engine.on('error', () => {
        resolveResult(
          createFailedTransfer('engine-error', ENGINE_BINARY.spawnFailedCode),
        );
      });
      engine.on('close', (exitCode) => {
        resolveResult(
          createFailedTransfer(
            'engine-error',
            exitCode ?? ENGINE_BINARY.spawnFailedCode,
          ),
        );
      });
    });
  }
}

/**
 * Applies one engine line to the transfer's outcome: fires the started
 * listener, or resolves the result once a terminal event arrives. The first
 * terminal signal wins, so the process-close fallback is ignored after a real
 * event has settled the promise.
 */
function applyEngineEvent(
  line: string,
  onStarted: TransferStartedListener,
  resolveResult: TransferResolver,
): void {
  const airDropEvent = parseAirDropEngineEvent(line);
  if (airDropEvent === undefined) {
    return;
  }

  if (airDropEvent.type === AirDropEventType.started) {
    onStarted(airDropEvent.files);
  }
  if (airDropEvent.type === AirDropEventType.complete) {
    resolveResult({ isSent: true });
  }
  if (airDropEvent.type === AirDropEventType.failed) {
    resolveResult(createFailedTransfer(airDropEvent.reason, airDropEvent.code));
  }
}

/**
 * Resolves the committed engine binary through its workspace package, so the
 * path holds for a local checkout and a global npm install alike.
 */
function resolveEngineBinaryPath(): string {
  const engineManifestUrl = import.meta.resolve(
    `${ENGINE_BINARY.package}/package.json`,
  );
  const engineManifestPath = fileURLToPath(engineManifestUrl);

  return join(dirname(engineManifestPath), ENGINE_BINARY.subpath);
}
