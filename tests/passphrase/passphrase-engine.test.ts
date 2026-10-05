import { describe, expect, it } from "vitest";

import {
  MAX_PASSPHRASE_WORD_COUNT,
  PassphraseConfigurationError,
  countPassphraseSearchSpace,
  generatePassphrase,
  type PassphraseGenerationOptions,
  type PassphraseWordlist,
} from "../../src/passphrase/index.js";
import type { RandomSource } from "../../src/random/index.js";

class SequenceSource implements RandomSource {
  readonly #bytes: number[];

  constructor(bytes: number[]) {
    this.#bytes = [...bytes];
  }

  fill(target: Uint8Array): void {
    for (let index = 0; index < target.length; index += 1) {
      const value = this.#bytes.shift();

      if (value === undefined) {
        throw new Error("SequenceSource exhausted.");
      }

      target[index] = value;
    }
  }
}

const wordlist: PassphraseWordlist = {
  id: "test",
  words: ["alpha", "beta", "gamma"],
};

const baseOptions: PassphraseGenerationOptions = {
  wordCount: 2,
  separator: "-",
};

describe("countPassphraseSearchSpace", () => {
  it("counts ordered word selections exactly", () => {
    expect(countPassphraseSearchSpace(wordlist, baseOptions)).toBe(9n);
  });

  it("treats capitalization as deterministic and entropy-neutral", () => {
    expect(
      countPassphraseSearchSpace(wordlist, {
        ...baseOptions,
        capitalize: true,
      }),
    ).toBe(9n);
  });

  it("counts optional number and symbol tokens exactly", () => {
    expect(
      countPassphraseSearchSpace(wordlist, {
        ...baseOptions,
        includeNumber: true,
        includeSymbol: true,
        symbols: "!?",
      }),
    ).toBe(180n);
  });

  it("uses eight default symbols when no custom alphabet is provided", () => {
    expect(
      countPassphraseSearchSpace(wordlist, {
        ...baseOptions,
        includeSymbol: true,
      }),
    ).toBe(72n);
  });
});

describe("generatePassphrase", () => {
  it("uses uniform picks for every random token", () => {
    const source = new SequenceSource([0x01, 0x02, 0x04, 0x01]);

    expect(
      generatePassphrase(source, wordlist, {
        ...baseOptions,
        includeNumber: true,
        includeSymbol: true,
        symbols: "!?",
      }),
    ).toBe("beta-gamma-4-?");
  });

  it("capitalizes deterministically without changing random choices", () => {
    const source = new SequenceSource([0x00, 0x01]);

    expect(
      generatePassphrase(source, wordlist, {
        ...baseOptions,
        capitalize: true,
      }),
    ).toBe("Alpha-Beta");
  });
});

describe("passphrase validation", () => {
  it("rejects empty separators to preserve an injective representation", () => {
    expect(() =>
      countPassphraseSearchSpace(wordlist, {
        wordCount: 2,
        separator: "",
      }),
    ).toThrow(PassphraseConfigurationError);
  });

  it("rejects words that contain the configured separator", () => {
    expect(() =>
      countPassphraseSearchSpace(
        { words: ["alpha-beta", "gamma"] },
        baseOptions,
      ),
    ).toThrow(PassphraseConfigurationError);
  });

  it("rejects duplicate words after deterministic capitalization", () => {
    expect(() =>
      countPassphraseSearchSpace(
        { words: ["apple", "Apple"] },
        {
          ...baseOptions,
          capitalize: true,
        },
      ),
    ).toThrow(PassphraseConfigurationError);
  });

  it("rejects duplicate symbols", () => {
    expect(() =>
      countPassphraseSearchSpace(wordlist, {
        ...baseOptions,
        includeSymbol: true,
        symbols: "!!",
      }),
    ).toThrow(PassphraseConfigurationError);
  });

  it("rejects empty wordlists and empty words", () => {
    expect(() =>
      countPassphraseSearchSpace(
        { words: [] },
        baseOptions,
      ),
    ).toThrow(PassphraseConfigurationError);

    expect(() =>
      countPassphraseSearchSpace(
        { words: ["alpha", ""] },
        baseOptions,
      ),
    ).toThrow(PassphraseConfigurationError);
  });

  it("bounds wordCount to a safe operational range", () => {
    expect(() =>
      countPassphraseSearchSpace(wordlist, {
        wordCount: MAX_PASSPHRASE_WORD_COUNT + 1,
        separator: "-",
      }),
    ).toThrow(PassphraseConfigurationError);
  });
});
