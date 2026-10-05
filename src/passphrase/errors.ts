export type PassphraseConfigurationReason =
  | "INVALID_WORD_COUNT"
  | "EMPTY_SEPARATOR"
  | "EMPTY_WORDLIST"
  | "EMPTY_WORD"
  | "DUPLICATE_WORD"
  | "SEPARATOR_IN_WORD"
  | "EMPTY_SYMBOL_ALPHABET"
  | "DUPLICATE_SYMBOL";

export class PassphraseConfigurationError extends Error {
  readonly reason: PassphraseConfigurationReason;

  constructor(reason: PassphraseConfigurationReason, message: string) {
    super(message);
    this.name = "PassphraseConfigurationError";
    this.reason = reason;
  }
}
