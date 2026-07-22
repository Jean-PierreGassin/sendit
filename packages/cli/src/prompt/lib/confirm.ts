import { createInterface } from 'node:readline/promises';
import { isAbortError } from './is-abort-error.js';

const AFFIRMATIVE_ANSWERS: readonly string[] = ['y', 'yes'];

/**
 * Asks a yes/no question on the terminal. An empty answer takes `defaultYes`;
 * Ctrl+D and a non-interactive stdin both resolve `false`, so cancelling or a
 * piped/scripted run never blocks and never crashes.
 */
export async function confirm(
  question: string,
  defaultYes: boolean,
): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }

  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = (await readline.question(`${question} ${hint} `))
      .trim()
      .toLowerCase();
    if (answer === '') {
      return defaultYes;
    }

    return AFFIRMATIVE_ANSWERS.includes(answer);
  } catch (error) {
    if (isAbortError(error)) {
      return false;
    }

    throw error;
  } finally {
    readline.close();
  }
}
