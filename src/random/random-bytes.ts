import type { RandomSource } from "./random-source.js";

export function randomBytes(source: RandomSource, length: number): Uint8Array {
  if (!Number.isSafeInteger(length) || length < 0) {
    throw new RangeError("length must be a non-negative safe integer.");
  }

  const bytes = new Uint8Array(length);
  source.fill(bytes);
  return bytes;
}
