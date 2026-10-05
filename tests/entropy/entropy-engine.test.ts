import { describe, expect, it } from "vitest";

import { UnsatisfiableConstraintsError } from "../../src/constraints/index.js";
import {
  analyzePassphraseGenerationEntropy,
  analyzePasswordGenerationEntropy,
  entropyBitsFromSearchSpace,
  generationEntropyFromSearchSpace,
} from "../../src/entropy/index.js";

describe("entropyBitsFromSearchSpace", () => {
  it("handles one possible output as zero bits", () => {
    expect(entropyBitsFromSearchSpace(1n)).toBe(0);
  });

  it("matches ordinary logarithms for small search spaces", () => {
    expect(entropyBitsFromSearchSpace(3n)).toBeCloseTo(Math.log2(3), 14);
  });

  it("handles huge powers of two without converting the full BigInt to Number", () => {
    const combinations = 1n << 1000n;
    const report = generationEntropyFromSearchSpace(combinations);

    expect(report.combinations).toBe(combinations);
    expect(report.bits).toBe(1000);
    expect(report.floorBits).toBe(1000);
  });

  it("reports an exact floor for non-powers of two", () => {
    const report = generationEntropyFromSearchSpace((1n << 200n) + 123n);

    expect(report.floorBits).toBe(200);
    expect(report.bits).toBeGreaterThanOrEqual(200);
    expect(report.bits).toBeLessThan(201);
  });

  it("rejects empty search spaces", () => {
    expect(() => entropyBitsFromSearchSpace(0n)).toThrow(RangeError);
  });
});

describe("generation entropy analyzers", () => {
  it("derives password entropy from the exact constrained search space", () => {
    const report = analyzePasswordGenerationEntropy({
      length: 2,
      lowercase: true,
      uppercase: false,
      digits: true,
      symbols: false,
      minLowercase: 1,
      minDigits: 1,
    });

    expect(report.combinations).toBe(520n);
    expect(report.bits).toBeCloseTo(Math.log2(520), 14);
    expect(report.floorBits).toBe(9);
  });

  it("derives passphrase entropy from the exact generation process", () => {
    const report = analyzePassphraseGenerationEntropy(
      { words: ["alpha", "beta", "gamma"] },
      {
        wordCount: 2,
        separator: "-",
        includeNumber: true,
        includeSymbol: true,
        symbols: "!?",
      },
    );

    expect(report.combinations).toBe(180n);
    expect(report.bits).toBeCloseTo(Math.log2(180), 14);
    expect(report.floorBits).toBe(7);
  });

  it("rejects entropy analysis when password constraints have no outputs", () => {
    expect(() =>
      analyzePasswordGenerationEntropy({
        length: 1,
        lowercase: false,
        uppercase: false,
        digits: false,
        symbols: false,
      }),
    ).toThrow(UnsatisfiableConstraintsError);
  });
});
