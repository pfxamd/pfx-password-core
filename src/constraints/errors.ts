export type ConstraintConfigurationReason =
  | "INVALID_LENGTH"
  | "INVALID_MINIMUM"
  | "DUPLICATE_GROUP_ID"
  | "DUPLICATE_VALUE";

export class ConstraintConfigurationError extends Error {
  readonly reason: ConstraintConfigurationReason;

  constructor(reason: ConstraintConfigurationReason, message: string) {
    super(message);
    this.name = "ConstraintConfigurationError";
    this.reason = reason;
  }
}

export class UnsatisfiableConstraintsError extends Error {
  constructor(message = "The requested constraints have no valid sequences.") {
    super(message);
    this.name = "UnsatisfiableConstraintsError";
  }
}
