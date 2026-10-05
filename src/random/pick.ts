import type { RandomSource } from "./random-source.js";
import { uniformInt } from "./uniform-int.js";

export function securePick<T>(source: RandomSource, values: readonly T[]): T {
  if (values.length === 0) {
    throw new RangeError("values must contain at least one item.");
  }

  return values[uniformInt(source, 0, values.length)] as T;
}
