import { describe, expect, it } from "vitest";

import { UnsatisfiableConstraintsError } from "../../src/constraints/index.js";
import {
  ASCII_SYMBOLS,
  LOWERCASE,
  PasswordConfigurationError,
  countPasswordSearchSpace,
  generatePassword,
  type PasswordGenerationOptions,
} from "../../src/password/index.js";
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

const baseOptions: PasswordGenerationOptions = {
  length: 2,
  lowercase: true,
  uppercase: false,
  digits: true,
  symbols: false,
  minLowercase: 1,
  minDigits: 1,
};

describe("countPasswordSearchSpace", () => {
  it("counts the exact constrained password search space", () => {
    expect(countPasswordSearchSpace(baseOptions)).toBe(520n);
  });

  it("removes ambiguous characters before counting", () => {
    expect(
      countPasswordSearchSpace({
        length: 1,
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: false,
        excludeAmbiguous: true,
      }),
    ).toBe(57n);
  });

  it("applies custom exclusions across enabled groups", () => {
    expect(
      countPasswordSearchSpace({
        length: 1,
        lowercase: true,
        uppercase: false,
        digits: true,
        symbols: false,
        excludedCharacters: "abc09",
      }),
    ).toBe(31n);
  });

  it("uses the full printable ASCII punctuation set without spaces", () => {
    expect([...ASCII_SYMBOLS]).toHaveLength(32);
  });

  it("returns zero when enabled values cannot satisfy the request", () => {
    expect(
      countPasswordSearchSpace({
        length: 1,
        lowercase: true,
        uppercase: false,
        digits: false,
        symbols: false,
        minLowercase: 1,
        excludedCharacters: LOWERCASE,
      }),
    ).toBe(0n);
  });
});

describe("generatePassword", () => {
  it("samples directly from the exact constrained space", () => {
    const source = new SequenceSource([0, 0, 0, 0, 0]);

    expect(generatePassword(source, baseOptions)).toBe("a0");
  });

  it("rejects unsatisfiable configurations before returning a secret", () => {
    const source = new SequenceSource([]);

    expect(() =>
      generatePassword(source, {
        length: 1,
        lowercase: false,
        uppercase: false,
        digits: false,
        symbols: false,
      }),
    ).toThrow(UnsatisfiableConstraintsError);
  });
});

describe("password option validation", () => {
  it("rejects a positive minimum for a disabled group", () => {
    expect(() =>
      countPasswordSearchSpace({
        length: 8,
        lowercase: false,
        uppercase: true,
        digits: true,
        symbols: false,
        minLowercase: 1,
      }),
    ).toThrow(PasswordConfigurationError);
  });

  it("rejects invalid password lengths through the password API", () => {
    expect(() =>
      countPasswordSearchSpace({
        length: -1,
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: true,
      }),
    ).toThrow(PasswordConfigurationError);
  });

  it("rejects invalid minimums even when the group is disabled", () => {
    expect(() =>
      countPasswordSearchSpace({
        length: 8,
        lowercase: false,
        uppercase: true,
        digits: true,
        symbols: false,
        minLowercase: -1,
      }),
    ).toThrow(PasswordConfigurationError);
  });
});
