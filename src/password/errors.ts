export type PasswordConfigurationReason =
  | "INVALID_LENGTH"
  | "INVALID_MINIMUM"
  | "MINIMUM_FOR_DISABLED_GROUP";

export class PasswordConfigurationError extends Error {
  readonly reason: PasswordConfigurationReason;

  constructor(reason: PasswordConfigurationReason, message: string) {
    super(message);
    this.name = "PasswordConfigurationError";
    this.reason = reason;
  }
}
