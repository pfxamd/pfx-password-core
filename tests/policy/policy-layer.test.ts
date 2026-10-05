import { describe, expect, it } from "vitest";

import { analyzePasswordGenerationEntropy } from "../../src/entropy/index.js";
import {
  DEFAULT_PASSPHRASE_OPTIONS,
  DEFAULT_PASSWORD_OPTIONS,
  evaluatePassphrasePolicy,
  evaluatePasswordPolicy,
} from "../../src/policy/index.js";

describe("policy defaults", () => {
  it("uses a high-entropy password default without composition minimums", () => {
    expect(DEFAULT_PASSWORD_OPTIONS).toMatchObject({
      length: 20,
      lowercase: true,
      uppercase: true,
      digits: true,
      symbols: true,
      minLowercase: 0,
      minUppercase: 0,
      minDigits: 0,
      minSymbols: 0,
    });

    const entropy = analyzePasswordGenerationEntropy(DEFAULT_PASSWORD_OPTIONS);
    expect(entropy.bits).toBeGreaterThan(128);
  });

  it("keeps passphrase defaults independent from any bundled wordlist", () => {
    expect(DEFAULT_PASSPHRASE_OPTIONS).toEqual({
      wordCount: 6,
      separator: "-",
      capitalize: false,
      includeNumber: false,
      includeSymbol: false,
    });
  });
});

describe("evaluatePasswordPolicy", () => {
  it("reports no findings when configured targets are met", () => {
    const report = evaluatePasswordPolicy(
      {
        length: 20,
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: false,
        minLowercase: 1,
        minUppercase: 1,
        minDigits: 1,
      },
      {
        recommendation: {
          minimumEntropyBits: 80,
        },
        compatibility: {
          minLength: 12,
          maxLength: 64,
          minLowercase: 1,
          minUppercase: 1,
          minDigits: 1,
        },
      },
    );

    expect(report).toEqual({
      satisfied: true,
      findings: [],
    });
  });

  it("reports entropy as an advisory rather than a hard generator error", () => {
    const report = evaluatePasswordPolicy(
      {
        length: 1,
        lowercase: true,
        uppercase: false,
        digits: false,
        symbols: false,
      },
      {
        recommendation: {
          minimumEntropyBits: 80,
        },
      },
    );

    expect(report.satisfied).toBe(false);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]).toMatchObject({
      code: "ENTROPY_BELOW_TARGET",
      severity: "advisory",
      expected: 80,
    });
  });

  it("checks guaranteed composition counts for compatibility", () => {
    const report = evaluatePasswordPolicy(
      {
        length: 16,
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: true,
      },
      {
        compatibility: {
          minUppercase: 1,
          minDigits: 2,
          minSymbols: 1,
        },
      },
    );

    expect(report.findings.map((finding) => finding.code)).toEqual([
      "UPPERCASE_MINIMUM_NOT_GUARANTEED",
      "DIGIT_MINIMUM_NOT_GUARANTEED",
      "SYMBOL_MINIMUM_NOT_GUARANTEED",
    ]);
  });

  it("treats a disabled character group as guaranteeing zero characters", () => {
    const report = evaluatePasswordPolicy(
      {
        length: 16,
        lowercase: true,
        uppercase: false,
        digits: true,
        symbols: false,
        minLowercase: 1,
        minDigits: 1,
      },
      {
        compatibility: {
          minUppercase: 1,
        },
      },
    );

    expect(report.findings).toEqual([
      {
        code: "UPPERCASE_MINIMUM_NOT_GUARANTEED",
        severity: "warning",
        message: "uppercase minimum is not guaranteed by the generation options.",
        actual: 0,
        expected: 1,
      },
    ]);
  });

  it("reports target-system length limits separately from entropy", () => {
    const below = evaluatePasswordPolicy(
      {
        length: 8,
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: true,
      },
      {
        compatibility: {
          minLength: 12,
        },
      },
    );

    expect(below.findings[0]?.code).toBe("LENGTH_BELOW_COMPATIBILITY_MINIMUM");

    const above = evaluatePasswordPolicy(
      {
        length: 80,
        lowercase: true,
        uppercase: true,
        digits: true,
        symbols: true,
      },
      {
        compatibility: {
          maxLength: 64,
        },
      },
    );

    expect(above.findings[0]?.code).toBe("LENGTH_ABOVE_COMPATIBILITY_MAXIMUM");
  });

  it("rejects malformed policy configuration", () => {
    expect(() =>
      evaluatePasswordPolicy(
        DEFAULT_PASSWORD_OPTIONS,
        {
          recommendation: {
            minimumEntropyBits: Number.POSITIVE_INFINITY,
          },
        },
      ),
    ).toThrow(RangeError);

    expect(() =>
      evaluatePasswordPolicy(
        DEFAULT_PASSWORD_OPTIONS,
        {
          compatibility: {
            minLength: 20,
            maxLength: 10,
          },
        },
      ),
    ).toThrow(RangeError);
  });
});

describe("evaluatePassphrasePolicy", () => {
  it("derives recommendations from the supplied wordlist search space", () => {
    const report = evaluatePassphrasePolicy(
      {
        words: ["alpha", "beta", "gamma", "delta"],
      },
      {
        wordCount: 3,
        separator: "-",
      },
      {
        recommendation: {
          minimumEntropyBits: 7,
        },
      },
    );

    expect(report).toEqual({
      satisfied: false,
      findings: [
        {
          code: "ENTROPY_BELOW_TARGET",
          severity: "advisory",
          message: "generation entropy is below the configured target.",
          actual: 6,
          expected: 7,
        },
      ],
    });
  });
});
