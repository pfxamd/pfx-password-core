export type PolicyFindingSeverity = "warning" | "advisory";

export type PolicyFindingCode =
  | "ENTROPY_BELOW_TARGET"
  | "LENGTH_BELOW_COMPATIBILITY_MINIMUM"
  | "LENGTH_ABOVE_COMPATIBILITY_MAXIMUM"
  | "LOWERCASE_MINIMUM_NOT_GUARANTEED"
  | "UPPERCASE_MINIMUM_NOT_GUARANTEED"
  | "DIGIT_MINIMUM_NOT_GUARANTEED"
  | "SYMBOL_MINIMUM_NOT_GUARANTEED";

export interface PolicyFinding {
  readonly code: PolicyFindingCode;
  readonly severity: PolicyFindingSeverity;
  readonly message: string;
  readonly actual?: number;
  readonly expected?: number;
}

export interface GenerationRecommendationPolicy {
  /**
   * Advisory target for entropy produced by the known uniform generation
   * process. The core intentionally provides no universal default threshold.
   */
  readonly minimumEntropyBits?: number;
}

export interface PasswordCompatibilityPolicy {
  /** Minimum accepted password length for a target system. */
  readonly minLength?: number;

  /** Maximum accepted password length for a target system. */
  readonly maxLength?: number;

  /** Minimum counts that the generated password must guarantee. */
  readonly minLowercase?: number;
  readonly minUppercase?: number;
  readonly minDigits?: number;
  readonly minSymbols?: number;
}

export interface PasswordPolicy {
  readonly recommendation?: GenerationRecommendationPolicy;
  readonly compatibility?: PasswordCompatibilityPolicy;
}

export interface PassphrasePolicy {
  readonly recommendation?: GenerationRecommendationPolicy;
}

export interface PolicyReport {
  readonly satisfied: boolean;
  readonly findings: readonly PolicyFinding[];
}
