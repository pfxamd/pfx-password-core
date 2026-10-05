import { analyzePassphraseGenerationEntropy, analyzePasswordGenerationEntropy } from "../entropy/analyze.js";
import type {
  PassphraseGenerationOptions,
  PassphraseWordlist,
} from "../passphrase/types.js";
import type { PasswordGenerationOptions } from "../password/types.js";
import type {
  GenerationRecommendationPolicy,
  PassphrasePolicy,
  PasswordCompatibilityPolicy,
  PasswordPolicy,
  PolicyFinding,
  PolicyReport,
} from "./types.js";

function validateOptionalNonNegativeNumber(
  value: number | undefined,
  name: string,
): void {
  if (
    value !== undefined &&
    (!Number.isFinite(value) || value < 0)
  ) {
    throw new RangeError(`${name} must be a finite non-negative number.`);
  }
}

function validateOptionalNonNegativeInteger(
  value: number | undefined,
  name: string,
): void {
  if (
    value !== undefined &&
    (!Number.isSafeInteger(value) || value < 0)
  ) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

function validateRecommendationPolicy(
  policy: GenerationRecommendationPolicy | undefined,
): void {
  validateOptionalNonNegativeNumber(
    policy?.minimumEntropyBits,
    "minimumEntropyBits",
  );
}

function validateCompatibilityPolicy(
  policy: PasswordCompatibilityPolicy | undefined,
): void {
  validateOptionalNonNegativeInteger(policy?.minLength, "minLength");
  validateOptionalNonNegativeInteger(policy?.maxLength, "maxLength");
  validateOptionalNonNegativeInteger(policy?.minLowercase, "minLowercase");
  validateOptionalNonNegativeInteger(policy?.minUppercase, "minUppercase");
  validateOptionalNonNegativeInteger(policy?.minDigits, "minDigits");
  validateOptionalNonNegativeInteger(policy?.minSymbols, "minSymbols");

  if (
    policy?.minLength !== undefined &&
    policy.maxLength !== undefined &&
    policy.minLength > policy.maxLength
  ) {
    throw new RangeError("minLength must not be greater than maxLength.");
  }
}

function entropyFinding(
  actualBits: number,
  policy: GenerationRecommendationPolicy | undefined,
): PolicyFinding | undefined {
  const target = policy?.minimumEntropyBits;

  if (target === undefined || actualBits >= target) {
    return undefined;
  }

  return {
    code: "ENTROPY_BELOW_TARGET",
    severity: "advisory",
    message: "generation entropy is below the configured target.",
    actual: actualBits,
    expected: target,
  };
}

function guaranteedMinimum(value: number | undefined): number {
  return value ?? 0;
}

function compatibilityFindings(
  options: PasswordGenerationOptions,
  policy: PasswordCompatibilityPolicy | undefined,
): PolicyFinding[] {
  if (policy === undefined) {
    return [];
  }

  const findings: PolicyFinding[] = [];

  if (policy.minLength !== undefined && options.length < policy.minLength) {
    findings.push({
      code: "LENGTH_BELOW_COMPATIBILITY_MINIMUM",
      severity: "warning",
      message: "password length is below the configured compatibility minimum.",
      actual: options.length,
      expected: policy.minLength,
    });
  }

  if (policy.maxLength !== undefined && options.length > policy.maxLength) {
    findings.push({
      code: "LENGTH_ABOVE_COMPATIBILITY_MAXIMUM",
      severity: "warning",
      message: "password length is above the configured compatibility maximum.",
      actual: options.length,
      expected: policy.maxLength,
    });
  }

  const requiredGroups = [
    {
      code: "LOWERCASE_MINIMUM_NOT_GUARANTEED" as const,
      expected: policy.minLowercase,
      actual: options.lowercase ? guaranteedMinimum(options.minLowercase) : 0,
      label: "lowercase",
    },
    {
      code: "UPPERCASE_MINIMUM_NOT_GUARANTEED" as const,
      expected: policy.minUppercase,
      actual: options.uppercase ? guaranteedMinimum(options.minUppercase) : 0,
      label: "uppercase",
    },
    {
      code: "DIGIT_MINIMUM_NOT_GUARANTEED" as const,
      expected: policy.minDigits,
      actual: options.digits ? guaranteedMinimum(options.minDigits) : 0,
      label: "digit",
    },
    {
      code: "SYMBOL_MINIMUM_NOT_GUARANTEED" as const,
      expected: policy.minSymbols,
      actual: options.symbols ? guaranteedMinimum(options.minSymbols) : 0,
      label: "symbol",
    },
  ];

  for (const group of requiredGroups) {
    if (group.expected !== undefined && group.actual < group.expected) {
      findings.push({
        code: group.code,
        severity: "warning",
        message: `${group.label} minimum is not guaranteed by the generation options.`,
        actual: group.actual,
        expected: group.expected,
      });
    }
  }

  return findings;
}

function report(findings: PolicyFinding[]): PolicyReport {
  return {
    satisfied: findings.length === 0,
    findings,
  };
}

export function evaluatePasswordPolicy(
  options: PasswordGenerationOptions,
  policy: PasswordPolicy,
): PolicyReport {
  validateRecommendationPolicy(policy.recommendation);
  validateCompatibilityPolicy(policy.compatibility);

  // Entropy analysis also validates the underlying generator configuration.
  const entropy = analyzePasswordGenerationEntropy(options);
  const findings = compatibilityFindings(options, policy.compatibility);
  const entropyAdvisory = entropyFinding(
    entropy.bits,
    policy.recommendation,
  );

  if (entropyAdvisory !== undefined) {
    findings.push(entropyAdvisory);
  }

  return report(findings);
}

export function evaluatePassphrasePolicy(
  wordlist: PassphraseWordlist,
  options: PassphraseGenerationOptions,
  policy: PassphrasePolicy,
): PolicyReport {
  validateRecommendationPolicy(policy.recommendation);

  // Entropy analysis also validates the underlying generator configuration.
  const entropy = analyzePassphraseGenerationEntropy(wordlist, options);
  const findings: PolicyFinding[] = [];
  const entropyAdvisory = entropyFinding(
    entropy.bits,
    policy.recommendation,
  );

  if (entropyAdvisory !== undefined) {
    findings.push(entropyAdvisory);
  }

  return report(findings);
}
