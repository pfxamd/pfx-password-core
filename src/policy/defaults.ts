import type { PassphraseGenerationOptions } from "../passphrase/types.js";
import type { PasswordGenerationOptions } from "../password/types.js";

/**
 * Generator defaults are convenience values, not authentication requirements.
 *
 * No minimum character counts are forced because composition rules are treated
 * as target-system compatibility constraints rather than inherent security
 * requirements.
 */
export const DEFAULT_PASSWORD_OPTIONS: Readonly<PasswordGenerationOptions> = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
  minLowercase: 0,
  minUppercase: 0,
  minDigits: 0,
  minSymbols: 0,
  excludeAmbiguous: false,
};

export const DEFAULT_PASSPHRASE_OPTIONS: Readonly<PassphraseGenerationOptions> = {
  wordCount: 6,
  separator: "-",
  capitalize: false,
  includeNumber: false,
  includeSymbol: false,
};
