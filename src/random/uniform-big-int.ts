import { randomBytes } from "./random-bytes.js";
import type { RandomSource } from "./random-source.js";

function decodeBigEndian(bytes: Uint8Array): bigint {
  let value = 0n;

  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }

  return value;
}

/**
 * Samples uniformly from [min, maxExclusive).
 *
 * The candidate is masked to the minimum required bit width and candidates
 * outside the requested range are rejected. This avoids modulo bias.
 */
export function uniformBigInt(
  source: RandomSource,
  min: bigint,
  maxExclusive: bigint,
): bigint {
  if (maxExclusive <= min) {
    throw new RangeError("maxExclusive must be greater than min.");
  }

  const range = maxExclusive - min;

  if (range === 1n) {
    return min;
  }

  const bitLength = (range - 1n).toString(2).length;
  const byteLength = Math.ceil(bitLength / 8);
  const excessBits = byteLength * 8 - bitLength;

  while (true) {
    const bytes = randomBytes(source, byteLength);

    if (excessBits > 0) {
      const mask = 0xff >>> excessBits;
      bytes[0] = (bytes[0] ?? 0) & mask;
    }

    const candidate = decodeBigEndian(bytes);

    if (candidate < range) {
      return min + candidate;
    }
  }
}
