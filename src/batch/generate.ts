import type {
  PassphraseGenerationOptions,
  PassphraseWordlist,
} from "../passphrase/types.js";
import {
  countPassphraseSearchSpace,
  generatePassphrase,
} from "../passphrase/model.js";
import type { PasswordGenerationOptions } from "../password/types.js";
import {
  countPasswordSearchSpace,
  generatePassword,
} from "../password/generate.js";
import { UnsatisfiableConstraintsError } from "../constraints/errors.js";
import type { RandomSource } from "../random/random-source.js";
import { BatchConfigurationError } from "./errors.js";
import type { RandomSourceFactory } from "./types.js";

export const MAX_BATCH_COUNT = 10_000;

function validateCount(count: number): void {
  if (
    !Number.isSafeInteger(count) ||
    count <= 0 ||
    count > MAX_BATCH_COUNT
  ) {
    throw new BatchConfigurationError(
      "INVALID_COUNT",
      `count must be an integer between 1 and ${MAX_BATCH_COUNT}.`,
    );
  }
}

export function generateBatch<T>(
  sourceFactory: RandomSourceFactory,
  count: number,
  generateOne: (source: RandomSource, index: number) => T,
): T[] {
  validateCount(count);

  const results: T[] = [];
  const seenSources = new Set<RandomSource>();

  for (let index = 0; index < count; index += 1) {
    const source = sourceFactory(index);

    if (seenSources.has(source)) {
      throw new BatchConfigurationError(
        "REUSED_RANDOM_SOURCE",
        "sourceFactory must return a distinct RandomSource object for every batch item.",
      );
    }

    seenSources.add(source);
    results.push(generateOne(source, index));
  }

  return results;
}

export function generatePasswordBatch(
  sourceFactory: RandomSourceFactory,
  count: number,
  options: PasswordGenerationOptions,
): string[] {
  const combinations = countPasswordSearchSpace(options);

  if (combinations === 0n) {
    throw new UnsatisfiableConstraintsError();
  }

  return generateBatch(sourceFactory, count, (source) =>
    generatePassword(source, options),
  );
}

export function generatePassphraseBatch(
  sourceFactory: RandomSourceFactory,
  count: number,
  wordlist: PassphraseWordlist,
  options: PassphraseGenerationOptions,
): string[] {
  // Preflight validation before the first secret is generated.
  countPassphraseSearchSpace(wordlist, options);

  return generateBatch(sourceFactory, count, (source) =>
    generatePassphrase(source, wordlist, options),
  );
}
