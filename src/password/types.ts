export interface PasswordGenerationOptions {
  readonly length: number;

  readonly lowercase: boolean;
  readonly uppercase: boolean;
  readonly digits: boolean;
  readonly symbols: boolean;

  readonly minLowercase?: number;
  readonly minUppercase?: number;
  readonly minDigits?: number;
  readonly minSymbols?: number;

  /** Removes visually ambiguous ASCII characters: 0, O, 1, l, I. */
  readonly excludeAmbiguous?: boolean;

  /** Additional Unicode code points to remove from all enabled sets. */
  readonly excludedCharacters?: string;
}
