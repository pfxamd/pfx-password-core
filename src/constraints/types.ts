export interface ConstrainedGroup<T> {
  /**
   * Optional diagnostic identifier. It does not affect sampling.
   */
  readonly id?: string;

  /**
   * Values owned exclusively by this group.
   *
   * Values must not be duplicated within this group or appear in any other
   * group in the same specification.
   */
  readonly values: readonly T[];

  /**
   * Minimum number of positions that must be filled from this group.
   */
  readonly minimum: number;
}

export interface ConstrainedSequenceSpec<T> {
  readonly length: number;
  readonly groups: readonly ConstrainedGroup<T>[];
}
