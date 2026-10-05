import {
  ConstraintComplexityError,
  ConstraintConfigurationError,
  UnsatisfiableConstraintsError,
} from "./errors.js";
import type { ConstrainedSequenceSpec } from "./types.js";
import type { RandomSource } from "../random/random-source.js";
import { uniformBigInt } from "../random/uniform-big-int.js";
import { uniformInt } from "../random/uniform-int.js";

const MAX_MEMOIZED_STATES = 250_000;

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

interface CountFrame {
  readonly remaining: number;
  readonly deficits: readonly number[];
  readonly key: string;
  expanded: boolean;
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
          "a value is assigned more than once across constrained groups.",
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

function immediateCount<T>(
  prepared: PreparedSpec<T>,
  remaining: number,
  deficits: readonly number[],
): bigint | undefined {
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

  if (required === 0) {
    return prepared.alphabetSize ** BigInt(remaining);
  }

  return undefined;
}

function nextDeficits(deficits: readonly number[], groupIndex: number): number[] {
  const next = [...deficits];
  next[groupIndex] = Math.max(0, (next[groupIndex] ?? 0) - 1);
  return next;
}

function createCounter<T>(prepared: PreparedSpec<T>) {
  const memo = new Map<string, bigint>();

  const store = (key: string, value: bigint) => {
    if (!memo.has(key) && memo.size >= MAX_MEMOIZED_STATES) {
      throw new ConstraintComplexityError();
    }

    memo.set(key, value);
  };

  const count = (remaining: number, deficits: readonly number[]): bigint => {
    const direct = immediateCount(prepared, remaining, deficits);

    if (direct !== undefined) {
      return direct;
    }

    const initialKey = stateKey(remaining, deficits);
    const initialCached = memo.get(initialKey);

    if (initialCached !== undefined) {
      return initialCached;
    }

    const scheduled = new Set<string>([initialKey]);
    const stack: CountFrame[] = [
      {
        remaining,
        deficits: [...deficits],
        key: initialKey,
        expanded: false,
      },
    ];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];

      if (frame === undefined) {
        throw new Error("Constraint counter reached an unreachable empty frame.");
      }

      const cached = memo.get(frame.key);

      if (cached !== undefined) {
        scheduled.delete(frame.key);
        stack.pop();
        continue;
      }

      if (!frame.expanded) {
        frame.expanded = true;

        for (let groupIndex = prepared.groups.length - 1; groupIndex >= 0; groupIndex -= 1) {
          const group = prepared.groups[groupIndex];

          if (group === undefined || group.size === 0n) {
            continue;
          }

          const childDeficits = nextDeficits(frame.deficits, groupIndex);
          const childRemaining = frame.remaining - 1;
          const childDirect = immediateCount(prepared, childRemaining, childDeficits);

          if (childDirect !== undefined) {
            continue;
          }

          const childKey = stateKey(childRemaining, childDeficits);

          if (!memo.has(childKey) && !scheduled.has(childKey)) {
            scheduled.add(childKey);
            stack.push({
              remaining: childRemaining,
              deficits: childDeficits,
              key: childKey,
              expanded: false,
            });
          }
        }

        continue;
      }

      let total = 0n;

      for (let groupIndex = 0; groupIndex < prepared.groups.length; groupIndex += 1) {
        const group = prepared.groups[groupIndex];

        if (group === undefined || group.size === 0n) {
          continue;
        }

        const childDeficits = nextDeficits(frame.deficits, groupIndex);
        const childRemaining = frame.remaining - 1;
        const childDirect = immediateCount(prepared, childRemaining, childDeficits);
        const childCount =
          childDirect ?? memo.get(stateKey(childRemaining, childDeficits));

        if (childCount === undefined) {
          throw new Error("Constraint counter reached an unresolved child state.");
        }

        total += group.size * childCount;
      }

      store(frame.key, total);
      scheduled.delete(frame.key);
      stack.pop();
    }

    const result = memo.get(initialKey);

    if (result === undefined) {
      throw new Error("Constraint counter failed to resolve the requested state.");
    }

    return result;
  };

  return count;
}

function chooseGroupBySize<T>(
  source: RandomSource,
  prepared: PreparedSpec<T>,
): number {
  if (prepared.alphabetSize === 0n) {
    throw new UnsatisfiableConstraintsError();
  }

  const ticket = uniformBigInt(source, 0n, prepared.alphabetSize);
  let cursor = 0n;

  for (let groupIndex = 0; groupIndex < prepared.groups.length; groupIndex += 1) {
    cursor += prepared.groups[groupIndex]?.size ?? 0n;

    if (ticket < cursor) {
      return groupIndex;
    }
  }

  throw new Error("Alphabet selection reached an unreachable state.");
}

function chooseWeightedGroup<T>(
  source: RandomSource,
  prepared: PreparedSpec<T>,
  remaining: number,
  deficits: readonly number[],
  count: (remaining: number, deficits: readonly number[]) => bigint,
): number {
  if (sum(deficits) === 0) {
    return chooseGroupBySize(source, prepared);
  }

  const weights: bigint[] = [];
  let totalWeight = 0n;

  for (let groupIndex = 0; groupIndex < prepared.groups.length; groupIndex += 1) {
    const group = prepared.groups[groupIndex];

    if (group === undefined || group.size === 0n) {
      weights.push(0n);
      continue;
    }

    const childDeficits = nextDeficits(deficits, groupIndex);
    const weight = group.size * count(remaining - 1, childDeficits);
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
  const deficits = [...prepared.minimums];

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
