/**
 * True when a readline prompt was aborted by the user pressing Ctrl+D (EOF),
 * which Node surfaces as an `AbortError`. Prompt helpers treat it as "cancel"
 * rather than letting the rejection crash the process with a stack trace.
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
