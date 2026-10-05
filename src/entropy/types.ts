export interface GenerationEntropy {
  /** Exact number of outputs in the uniform generation space. */
  readonly combinations: bigint;

  /**
   * log2(combinations), represented as a JavaScript number.
   *
   * The search-space size remains exact in combinations. Fractional entropy
   * is necessarily represented with floating-point precision.
   */
  readonly bits: number;

  /** Exact floor(log2(combinations)). */
  readonly floorBits: number;
}
