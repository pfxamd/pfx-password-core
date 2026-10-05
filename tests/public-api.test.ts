import { describe, expect, it } from "vitest";

import {
  DEFAULT_PASSWORD_OPTIONS,
  WebCryptoRandomSource,
  analyzePasswordGenerationEntropy,
  evaluatePasswordPolicy,
  generatePassphrase,
  generatePassword,
  generatePasswordBatch,
  type RandomSource,
} from "../src/index.js";

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

describe("public API", () => {
  it("generates a password through the package root with an injected source", () => {
    const password = generatePassword(
      {
        length: 2,
        lowercase: true,
        uppercase: false,
        digits: true,
        symbols: false,
        minLowercase: 1,
        minDigits: 1,
      },
      new SequenceSource([0, 0, 0, 0]),
    );

    expect(password).toBe("a0");
  });

  it("generates a passphrase through the package root", () => {
    const passphrase = generatePassphrase(
      { words: ["alpha", "beta"] },
      {
        wordCount: 2,
        separator: "-",
      },
      new SequenceSource([0, 1]),
    );

    expect(passphrase).toBe("alpha-beta");
  });

  it("generates a batch through the package root", () => {
    const result = generatePasswordBatch(
      3,
      {
        length: 1,
        lowercase: true,
        uppercase: false,
        digits: false,
        symbols: false,
      },
      (index) => new SequenceSource([index]),
    );

    expect(result).toEqual(["a", "b", "c"]);
  });

  it("exposes entropy and policy analysis without exposing internal samplers", () => {
    const entropy = analyzePasswordGenerationEntropy(DEFAULT_PASSWORD_OPTIONS);
    const report = evaluatePasswordPolicy(DEFAULT_PASSWORD_OPTIONS, {
      recommendation: {
        minimumEntropyBits: 128,
      },
    });

    expect(entropy.bits).toBeGreaterThan(128);
    expect(report.satisfied).toBe(true);
  });

  it("can construct the default production random source", () => {
    expect(new WebCryptoRandomSource()).toBeInstanceOf(WebCryptoRandomSource);
  });
});
