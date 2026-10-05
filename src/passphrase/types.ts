export interface PassphraseWordlist {
  /**
   * Optional identifier used only for diagnostics and metadata.
   * Licensing remains the responsibility of the package providing the list.
   */
  readonly id?: string;

  /**
   * Candidate words. The core treats these as data and never fetches a list.
   */
  readonly words: readonly string[];
}

export interface PassphraseGenerationOptions {
  /** Number of randomly selected words. */
  readonly wordCount: number;

  /**
   * Non-empty separator placed between every generated token.
   *
   * v1 requires a non-empty separator so the generated representation remains
   * injective and the reported search space remains exact.
   */
  readonly separator: string;

  /** Deterministically uppercase the first Unicode code point of each word. */
  readonly capitalize?: boolean;

  /** Append one uniformly selected decimal digit as a final token. */
  readonly includeNumber?: boolean;

  /** Append one uniformly selected symbol as a final token. */
  readonly includeSymbol?: boolean;

  /**
   * Symbol alphabet used when includeSymbol is enabled.
   * Each Unicode code point must be unique.
   */
  readonly symbols?: string;
}
