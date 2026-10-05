export {
  generatePassphrase,
  generatePassphraseBatch,
  generatePassword,
  generatePasswordBatch,
} from "./api.js";

export {
  countPassphraseSearchSpace,
} from "./passphrase/model.js";
export {
  PassphraseConfigurationError,
  type PassphraseConfigurationReason,
} from "./passphrase/errors.js";
export type {
  PassphraseGenerationOptions,
  PassphraseWordlist,
} from "./passphrase/types.js";

export {
  countPasswordSearchSpace,
} from "./password/generate.js";
export {
  PasswordConfigurationError,
  type PasswordConfigurationReason,
} from "./password/errors.js";
export type { PasswordGenerationOptions } from "./password/types.js";

export {
  analyzePassphraseGenerationEntropy,
  analyzePasswordGenerationEntropy,
} from "./entropy/analyze.js";
export {
  entropyBitsFromSearchSpace,
  generationEntropyFromSearchSpace,
} from "./entropy/search-space.js";
export type { GenerationEntropy } from "./entropy/types.js";

export {
  DEFAULT_PASSPHRASE_OPTIONS,
  DEFAULT_PASSWORD_OPTIONS,
} from "./policy/defaults.js";
export {
  evaluatePassphrasePolicy,
  evaluatePasswordPolicy,
} from "./policy/validate.js";
export type {
  GenerationRecommendationPolicy,
  PassphrasePolicy,
  PasswordCompatibilityPolicy,
  PasswordPolicy,
  PolicyFinding,
  PolicyFindingCode,
  PolicyFindingSeverity,
  PolicyReport,
} from "./policy/types.js";

export {
  BatchConfigurationError,
  type BatchConfigurationReason,
} from "./batch/errors.js";
export { MAX_BATCH_COUNT } from "./batch/generate.js";
export type { RandomSourceFactory } from "./batch/types.js";

export {
  ConstraintComplexityError,
  UnsatisfiableConstraintsError,
} from "./constraints/errors.js";

export type { RandomSource } from "./random/random-source.js";
export {
  WEB_CRYPTO_MAX_BYTES,
  WebCryptoRandomSource,
} from "./random/web-crypto-source.js";
