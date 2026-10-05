import type { RandomSource } from "./random-source.js";
import { uniformInt } from "./uniform-int.js";

/**
 * Returns a uniformly shuffled copy using Fisher-Yates and unbiased indices.
 */
export function secureShuffle<T>(source: RandomSource, values: readonly T[]): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = uniformInt(source, 0, index + 1);
    const current = shuffled[index] as T;
    shuffled[index] = shuffled[swapIndex] as T;
    shuffled[swapIndex] = current;
  }

  return shuffled;
}
