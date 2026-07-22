import { createInterface } from 'node:readline/promises';

const AFFIRMATIVE_ANSWERS: readonly string[] = ['y', 'yes'];

/**
 * Asks a yes/no question on the terminal. An empty answer takes `defaultYes`;
 * a non-interactive stdin never blocks and resolves `false`, so piped or
 * scripted runs are unaffected.
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

  const answer = (await readline.question(`${question} ${hint} `))
    .trim()
    .toLowerCase();
  readline.close();

  if (answer === '') {
    return defaultYes;
  }

  return AFFIRMATIVE_ANSWERS.includes(answer);
}
