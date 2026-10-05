export type BatchConfigurationReason =
  | "INVALID_COUNT"
  | "INVALID_RANDOM_SOURCE"
  | "REUSED_RANDOM_SOURCE";

export class BatchConfigurationError extends Error {
  readonly reason: BatchConfigurationReason;

  constructor(reason: BatchConfigurationReason, message: string) {
    super(message);
    this.name = "BatchConfigurationError";
    this.reason = reason;
  }
}
