import { AirDropEventType, type AirDropEvent } from '../types/airdrop-event.js';

/**
 * Parses one NDJSON line emitted by the AirDrop Swift binary into an event,
 * returning undefined for anything unrecognised so a stray line can never
 * crash the CLI. Pure: the wire `event` slug is mapped to the `type`
 * discriminant here, at the one boundary that touches raw JSON.
 */
export function parseAirDropEngineEvent(
  line: string,
): AirDropEvent | undefined {
  const parsed = tryParseJson(line);
  if (!isRecord(parsed)) {
    return undefined;
  }

  if (
    parsed.event === AirDropEventType.started &&
    isStringArray(parsed.files)
  ) {
    return { type: AirDropEventType.started, files: parsed.files };
  }
  if (parsed.event === AirDropEventType.complete) {
    return { type: AirDropEventType.complete };
  }
  if (
    parsed.event === AirDropEventType.failed &&
    typeof parsed.reason === 'string' &&
    typeof parsed.code === 'number'
  ) {
    return {
      type: AirDropEventType.failed,
      reason: parsed.reason,
      code: parsed.code,
    };
  }

  return undefined;
}

function tryParseJson(line: string): unknown {
  try {
    return JSON.parse(line);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'string')
  );
}
