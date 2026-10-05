export type BatchConfigurationReason =
  | "INVALID_COUNT"
  | "REUSED_RANDOM_SOURCE";

export class BatchConfigurationError extends Error {
  readonly reason: BatchConfigurationReason;

  constructor(reason: BatchConfigurationReason, message: string) {
    super(message);
    this.name = "BatchConfigurationError";
    this.reason = reason;
  }
}
