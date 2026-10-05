import type { GenerationEntropy } from "./types.js";

const NUMBER_MANTISSA_BITS = 53;

export function entropyBitsFromSearchSpace(combinations: bigint): number {
  if (combinations <= 0n) {
    throw new RangeError("combinations must be greater than zero.");
  }

  if (combinations === 1n) {
    return 0;
  }

  const bitLength = combinations.toString(2).length;

  if (bitLength <= NUMBER_MANTISSA_BITS) {
    return Math.log2(Number(combinations));
  }

  const shift = bitLength - NUMBER_MANTISSA_BITS;
  const leading = Number(combinations >> BigInt(shift));

  return Math.log2(leading) + shift;
}

export function generationEntropyFromSearchSpace(
  combinations: bigint,
): GenerationEntropy {
  const bits = entropyBitsFromSearchSpace(combinations);

  return {
    combinations,
    bits,
    floorBits: combinations.toString(2).length - 1,
  };
}
