import {
  generatePassphraseBatch as generatePassphraseBatchWithFactory,
  generatePasswordBatch as generatePasswordBatchWithFactory,
} from "./batch/generate.js";
import type { RandomSourceFactory } from "./batch/types.js";
import {
  generatePassphrase as generatePassphraseWithSource,
} from "./passphrase/model.js";
import type {
  PassphraseGenerationOptions,
  PassphraseWordlist,
} from "./passphrase/types.js";
import {
  generatePassword as generatePasswordWithSource,
} from "./password/generate.js";
import type { PasswordGenerationOptions } from "./password/types.js";
import type { RandomSource } from "./random/random-source.js";
import { WebCryptoRandomSource } from "./random/web-crypto-source.js";

function createWebCryptoSource(): RandomSource {
  return new WebCryptoRandomSource();
}

export function generatePassword(
  options: PasswordGenerationOptions,
  source: RandomSource = createWebCryptoSource(),
): string {
  return generatePasswordWithSource(source, options);
}

export function generatePassphrase(
  wordlist: PassphraseWordlist,
  options: PassphraseGenerationOptions,
  source: RandomSource = createWebCryptoSource(),
): string {
  return generatePassphraseWithSource(source, wordlist, options);
}

export function generatePasswordBatch(
  count: number,
  options: PasswordGenerationOptions,
  sourceFactory: RandomSourceFactory = createWebCryptoSource,
): string[] {
  return generatePasswordBatchWithFactory(sourceFactory, count, options);
}

export function generatePassphraseBatch(
  count: number,
  wordlist: PassphraseWordlist,
  options: PassphraseGenerationOptions,
  sourceFactory: RandomSourceFactory = createWebCryptoSource,
): string[] {
  return generatePassphraseBatchWithFactory(
    sourceFactory,
    count,
    wordlist,
    options,
  );
}
