import type { RandomSource } from "./random-source.js";
import { uniformBigInt } from "./uniform-big-int.js";

/**
 * Samples a safe integer uniformly from [min, maxExclusive).
 */
export function uniformInt(
  source: RandomSource,
  min: number,
  maxExclusive: number,
): number {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(maxExclusive)) {
    throw new RangeError("min and maxExclusive must be safe integers.");
  }

  if (maxExclusive <= min) {
    throw new RangeError("maxExclusive must be greater than min.");
  }

  return Number(uniformBigInt(source, BigInt(min), BigInt(maxExclusive)));
}
