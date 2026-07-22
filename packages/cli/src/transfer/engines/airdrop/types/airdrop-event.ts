export const AirDropEventType = {
  started: 'started',
  complete: 'complete',
  failed: 'failed',
} as const;

export type AirDropEvent = StartedEvent | CompleteEvent | FailedEvent;

export interface StartedEvent {
  type: typeof AirDropEventType.started;
  files: string[];
}

export interface CompleteEvent {
  type: typeof AirDropEventType.complete;
}

export interface FailedEvent {
  type: typeof AirDropEventType.failed;
  reason: string;
  code: number;
}
