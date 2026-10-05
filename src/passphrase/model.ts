import { securePick } from "../random/pick.js";
import type { RandomSource } from "../random/random-source.js";
import { PassphraseConfigurationError } from "./errors.js";
import type {
  PassphraseGenerationOptions,
  PassphraseWordlist,
} from "./types.js";

const DECIMAL_DIGITS = "0123456789";
const DEFAULT_SYMBOLS = "!@#$%^&*";
export const MAX_PASSPHRASE_WORD_COUNT = 4_096;

interface PreparedPassphrase {
  readonly words: readonly string[];
  readonly wordCount: number;
  readonly separator: string;
  readonly includeNumber: boolean;
  readonly symbols: readonly string[];
}

function capitalizeFirstCodePoint(word: string): string {
  const codePoints = [...word];
  const first = codePoints[0];

  if (first === undefined) {
    return word;
  }

  return first.toUpperCase() + codePoints.slice(1).join("");
}

function prepareWordlist(
  wordlist: PassphraseWordlist,
  options: PassphraseGenerationOptions,
): readonly string[] {
  if (wordlist.words.length === 0) {
    throw new PassphraseConfigurationError(
      "EMPTY_WORDLIST",
      "wordlist must contain at least one word.",
    );
  }

  const transformed: string[] = [];
  const seen = new Set<string>();

  for (const originalWord of wordlist.words) {
    if (originalWord.length === 0) {
      throw new PassphraseConfigurationError(
        "EMPTY_WORD",
        "wordlist must not contain empty words.",
      );
    }

    const word = options.capitalize ? capitalizeFirstCodePoint(originalWord) : originalWord;

    if (word.includes(options.separator)) {
      throw new PassphraseConfigurationError(
        "SEPARATOR_IN_WORD",
        "wordlist entries must not contain the configured separator.",
      );
    }

    if (seen.has(word)) {
      throw new PassphraseConfigurationError(
        "DUPLICATE_WORD",
        "wordlist must remain unique after deterministic transformations.",
      );
    }

    seen.add(word);
    transformed.push(word);
  }

  return transformed;
}

function prepareSymbols(options: PassphraseGenerationOptions): readonly string[] {
  if (!(options.includeSymbol ?? false)) {
    return [];
  }

  const symbols = [...(options.symbols ?? DEFAULT_SYMBOLS)];

  if (symbols.length === 0) {
    throw new PassphraseConfigurationError(
      "EMPTY_SYMBOL_ALPHABET",
      "symbols must contain at least one Unicode code point when includeSymbol is enabled.",
    );
  }

  const seen = new Set<string>();

  for (const symbol of symbols) {
    if (seen.has(symbol)) {
      throw new PassphraseConfigurationError(
        "DUPLICATE_SYMBOL",
        "symbols must not contain duplicate Unicode code points.",
      );
    }

    seen.add(symbol);
  }

  return symbols;
}

function prepare(
  wordlist: PassphraseWordlist,
  options: PassphraseGenerationOptions,
): PreparedPassphrase {
  if (
    !Number.isSafeInteger(options.wordCount) ||
    options.wordCount <= 0 ||
    options.wordCount > MAX_PASSPHRASE_WORD_COUNT
  ) {
    throw new PassphraseConfigurationError(
      "INVALID_WORD_COUNT",
      `wordCount must be an integer between 1 and ${MAX_PASSPHRASE_WORD_COUNT}.`,
    );
  }

  if (options.separator.length === 0) {
    throw new PassphraseConfigurationError(
      "EMPTY_SEPARATOR",
      "separator must not be empty in passphrase v1.",
    );
  }

  return {
    words: prepareWordlist(wordlist, options),
    wordCount: options.wordCount,
    separator: options.separator,
    includeNumber: options.includeNumber ?? false,
    symbols: prepareSymbols(options),
  };
}

export function countPassphraseSearchSpace(
  wordlist: PassphraseWordlist,
  options: PassphraseGenerationOptions,
): bigint {
  const prepared = prepare(wordlist, options);

  let combinations = BigInt(prepared.words.length) ** BigInt(prepared.wordCount);

  if (prepared.includeNumber) {
    combinations *= BigInt(DECIMAL_DIGITS.length);
  }

  if (prepared.symbols.length > 0) {
    combinations *= BigInt(prepared.symbols.length);
  }

  return combinations;
}

export function generatePassphrase(
  source: RandomSource,
  wordlist: PassphraseWordlist,
  options: PassphraseGenerationOptions,
): string {
  const prepared = prepare(wordlist, options);
  const tokens: string[] = [];

  for (let index = 0; index < prepared.wordCount; index += 1) {
    tokens.push(securePick(source, prepared.words));
  }

  if (prepared.includeNumber) {
    tokens.push(securePick(source, [...DECIMAL_DIGITS]));
  }

  if (prepared.symbols.length > 0) {
    tokens.push(securePick(source, prepared.symbols));
  }

  return tokens.join(prepared.separator);
}
