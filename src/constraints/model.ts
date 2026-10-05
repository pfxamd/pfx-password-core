import {
  ConstraintConfigurationError,
  UnsatisfiableConstraintsError,
} from "./errors.js";
import type { ConstrainedSequenceSpec } from "./types.js";
import type { RandomSource } from "../random/random-source.js";
import { uniformBigInt } from "../random/uniform-big-int.js";
import { uniformInt } from "../random/uniform-int.js";

interface PreparedGroup<T> {
  readonly id: string | undefined;
  readonly values: readonly T[];
  readonly minimum: number;
  readonly size: bigint;
}

interface PreparedSpec<T> {
  readonly length: number;
  readonly groups: readonly PreparedGroup<T>[];
  readonly minimums: readonly number[];
  readonly alphabetSize: bigint;
}

function prepareSpec<T>(spec: ConstrainedSequenceSpec<T>): PreparedSpec<T> {
  if (!Number.isSafeInteger(spec.length) || spec.length < 0) {
    throw new ConstraintConfigurationError(
      "INVALID_LENGTH",
      "length must be a non-negative safe integer.",
    );
  }

  const seenValues = new Set<T>();
  const seenIds = new Set<string>();
  let alphabetSize = 0n;

  const groups = spec.groups.map((group, index): PreparedGroup<T> => {
    if (!Number.isSafeInteger(group.minimum) || group.minimum < 0) {
      throw new ConstraintConfigurationError(
        "INVALID_MINIMUM",
        `minimum for group ${group.id ?? index} must be a non-negative safe integer.`,
      );
    }

    if (group.id !== undefined) {
      if (seenIds.has(group.id)) {
        throw new ConstraintConfigurationError(
          "DUPLICATE_GROUP_ID",
          `group id "${group.id}" is used more than once.`,
        );
      }

      seenIds.add(group.id);
    }

    for (const value of group.values) {
      if (seenValues.has(value)) {
        throw new ConstraintConfigurationError(
          "DUPLICATE_VALUE",
          `a value is assigned more than once across constrained groups.`,
        );
      }

      seenValues.add(value);
    }

    alphabetSize += BigInt(group.values.length);

    return {
      id: group.id,
      values: group.values,
      minimum: group.minimum,
      size: BigInt(group.values.length),
    };
  });

  return {
    length: spec.length,
    groups,
    minimums: groups.map((group) => group.minimum),
    alphabetSize,
  };
}

function sum(values: readonly number[]): number {
  let total = 0;

  for (const value of values) {
    total += value;
  }

  return total;
}

function stateKey(remaining: number, deficits: readonly number[]): string {
  return `${remaining}|${deficits.join(",")}`;
}

function createCounter<T>(prepared: PreparedSpec<T>) {
  const memo = new Map<string, bigint>();

  const count = (remaining: number, deficits: readonly number[]): bigint => {
    const required = sum(deficits);

    if (required > remaining) {
      return 0n;
    }

    if (remaining === 0) {
      return required === 0 ? 1n : 0n;
    }

    if (prepared.alphabetSize === 0n) {
      return 0n;
    }

    // Once all minimums are satisfied, every remaining position may use any
    // value in the combined alphabet. This avoids unnecessary DP states.
    if (required === 0) {
      return prepared.alphabetSize ** BigInt(remaining);
    }

    const key = stateKey(remaining, deficits);
    const cached = memo.get(key);

    if (cached !== undefined) {
      return cached;
    }

    let total = 0n;

    for (let groupIndex = 0; groupIndex < prepared.groups.length; groupIndex += 1) {
      const group = prepared.groups[groupIndex];

      if (group === undefined || group.size === 0n) {
        continue;
      }

      const nextDeficits = [...deficits];
      const currentDeficit = nextDeficits[groupIndex] ?? 0;
      nextDeficits[groupIndex] = Math.max(0, currentDeficit - 1);

      total += group.size * count(remaining - 1, nextDeficits);
    }

    memo.set(key, total);
    return total;
  };

  return count;
}

function chooseWeightedGroup<T>(
  source: RandomSource,
  prepared: PreparedSpec<T>,
  remaining: number,
  deficits: readonly number[],
  count: (remaining: number, deficits: readonly number[]) => bigint,
): number {
  const weights: bigint[] = [];
  let totalWeight = 0n;

  for (let groupIndex = 0; groupIndex < prepared.groups.length; groupIndex += 1) {
    const group = prepared.groups[groupIndex];

    if (group === undefined || group.size === 0n) {
      weights.push(0n);
      continue;
    }

    const nextDeficits = [...deficits];
    const currentDeficit = nextDeficits[groupIndex] ?? 0;
    nextDeficits[groupIndex] = Math.max(0, currentDeficit - 1);

    const weight = group.size * count(remaining - 1, nextDeficits);
    weights.push(weight);
    totalWeight += weight;
  }

  if (totalWeight === 0n) {
    throw new UnsatisfiableConstraintsError();
  }

  const ticket = uniformBigInt(source, 0n, totalWeight);
  let cursor = 0n;

  for (let groupIndex = 0; groupIndex < weights.length; groupIndex += 1) {
    cursor += weights[groupIndex] ?? 0n;

    if (ticket < cursor) {
      return groupIndex;
    }
  }

  throw new Error("Weighted group selection reached an unreachable state.");
}

export function countConstrainedSequences<T>(spec: ConstrainedSequenceSpec<T>): bigint {
  const prepared = prepareSpec(spec);
  const count = createCounter(prepared);

  return count(prepared.length, prepared.minimums);
}

/**
 * Samples uniformly from every sequence that satisfies the supplied minimums.
 *
 * Uniformity is achieved by weighting each group choice by the exact number
 * of valid suffixes reachable after choosing from that group.
 */
export function sampleConstrainedSequence<T>(
  source: RandomSource,
  spec: ConstrainedSequenceSpec<T>,
): T[] {
  const prepared = prepareSpec(spec);
  const count = createCounter(prepared);
  const total = count(prepared.length, prepared.minimums);

  if (total === 0n) {
    throw new UnsatisfiableConstraintsError();
  }

  const result: T[] = [];
  let remaining = prepared.length;
  let deficits = [...prepared.minimums];

  while (remaining > 0) {
    const groupIndex = chooseWeightedGroup(source, prepared, remaining, deficits, count);
    const group = prepared.groups[groupIndex];

    if (group === undefined || group.values.length === 0) {
      throw new Error("Weighted sampling selected an empty group.");
    }

    const valueIndex = uniformInt(source, 0, group.values.length);
    const value = group.values[valueIndex];

    if (value === undefined) {
      throw new Error("Random value selection reached an unreachable state.");
    }

    result.push(value);

    deficits[groupIndex] = Math.max(0, (deficits[groupIndex] ?? 0) - 1);
    remaining -= 1;
  }

  return result;
}
