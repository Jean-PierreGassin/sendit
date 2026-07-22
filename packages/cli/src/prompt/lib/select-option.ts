import { createInterface } from 'node:readline/promises';
import { isAbortError } from './is-abort-error.js';

/** One selectable menu entry: the value returned when chosen, and its label. */
export interface SelectOption<T> {
  value: T;
  label: string;
}

/**
 * Presents a numbered menu and resolves the chosen value. A non-interactive
 * stdin (or an empty option list) resolves undefined so piped or scripted runs
 * never block. An empty answer takes the first option; an out-of-range or
 * non-numeric answer prints a hint and asks again.
 */
export async function selectOption<T>(
  question: string,
  options: readonly SelectOption<T>[],
): Promise<T | undefined> {
  const [firstOption] = options;
  if (!process.stdin.isTTY || firstOption === undefined) {
    return undefined;
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  process.stdout.write(`${question}\n`);
  options.forEach((option, index) => {
    process.stdout.write(`  ${index + 1}) ${option.label}\n`);
  });

  try {
    for (;;) {
      const answer = (
        await readline.question(`Choose [1-${options.length}]: `)
      ).trim();
      if (answer === '') {
        return firstOption.value;
      }

      const chosenOption = options[Number(answer) - 1];
      if (chosenOption !== undefined) {
        return chosenOption.value;
      }

      process.stdout.write(`Enter a number between 1 and ${options.length}.\n`);
    }
  } catch (error) {
    if (isAbortError(error)) {
      return undefined;
    }

    throw error;
  } finally {
    readline.close();
  }
}
