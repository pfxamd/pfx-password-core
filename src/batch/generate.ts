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

function prepareSources(
  sourceFactory: RandomSourceFactory,
  count: number,
): RandomSource[] {
  validateCount(count);

  const sources: RandomSource[] = [];
  const seenSources = new Set<RandomSource>();

  for (let index = 0; index < count; index += 1) {
    const source = sourceFactory(index);

    if (
      source === null ||
      typeof source !== "object" ||
      typeof source.fill !== "function"
    ) {
      throw new BatchConfigurationError(
        "INVALID_RANDOM_SOURCE",
        "sourceFactory must return a valid RandomSource object for every batch item.",
      );
    }

    if (seenSources.has(source)) {
      throw new BatchConfigurationError(
        "REUSED_RANDOM_SOURCE",
        "sourceFactory must return a distinct RandomSource object for every batch item.",
      );
    }

    seenSources.add(source);
    sources.push(source);
  }

  return sources;
}

export function generateBatch<T>(
  sourceFactory: RandomSourceFactory,
  count: number,
  generateOne: (source: RandomSource, index: number) => T,
): T[] {
  const sources = prepareSources(sourceFactory, count);

  return sources.map((source, index) => generateOne(source, index));
}

export function generatePasswordBatch(
  sourceFactory: RandomSourceFactory,
  count: number,
  options: PasswordGenerationOptions,
): string[] {
  validateCount(count);

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
  validateCount(count);

  // Preflight validation before the first secret is generated.
  countPassphraseSearchSpace(wordlist, options);

  return generateBatch(sourceFactory, count, (source) =>
    generatePassphrase(source, wordlist, options),
  );
}
