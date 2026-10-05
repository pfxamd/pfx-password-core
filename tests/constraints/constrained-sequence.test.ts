import { describe, expect, it } from "vitest";

import {
  ConstraintConfigurationError,
  UnsatisfiableConstraintsError,
  countConstrainedSequences,
  sampleConstrainedSequence,
  type ConstrainedSequenceSpec,
} from "../../src/constraints/index.js";
import type { RandomSource } from "../../src/random/index.js";

class SequenceSource implements RandomSource {
  readonly #bytes: number[];

  constructor(bytes: number[]) {
    this.#bytes = [...bytes];
  }

  fill(target: Uint8Array): void {
    for (let index = 0; index < target.length; index += 1) {
      const value = this.#bytes.shift();

      if (value === undefined) {
        throw new Error("SequenceSource exhausted.");
      }

      target[index] = value;
    }
  }
}

function bruteForceCount(spec: ConstrainedSequenceSpec<string>): bigint {
  const alphabet = spec.groups.flatMap((group, groupIndex) =>
    group.values.map((value) => ({ value, groupIndex })),
  );

  let count = 0n;

  const visit = (position: number, groupCounts: number[]) => {
    if (position === spec.length) {
      const valid = spec.groups.every(
        (group, groupIndex) => (groupCounts[groupIndex] ?? 0) >= group.minimum,
      );

      if (valid) {
        count += 1n;
      }

      return;
    }

    for (const entry of alphabet) {
      const nextCounts = [...groupCounts];
      nextCounts[entry.groupIndex] = (nextCounts[entry.groupIndex] ?? 0) + 1;
      visit(position + 1, nextCounts);
    }
  };

  visit(0, new Array(spec.groups.length).fill(0));
  return count;
}

describe("countConstrainedSequences", () => {
  it("counts an unconstrained alphabet exactly", () => {
    expect(
      countConstrainedSequences({
        length: 4,
        groups: [
          { id: "letters", values: ["a", "b"], minimum: 0 },
          { id: "digits", values: ["0"], minimum: 0 },
        ],
      }),
    ).toBe(81n);
  });

  it("counts constrained sequences exactly", () => {
    expect(
      countConstrainedSequences({
        length: 2,
        groups: [
          { id: "letters", values: ["a", "b"], minimum: 1 },
          { id: "digits", values: ["0"], minimum: 1 },
        ],
      }),
    ).toBe(4n);
  });

  it("matches brute force across small configurations", () => {
    const specs: ConstrainedSequenceSpec<string>[] = [
      {
        length: 3,
        groups: [
          { values: ["a", "b"], minimum: 1 },
          { values: ["0"], minimum: 1 },
        ],
      },
      {
        length: 4,
        groups: [
          { values: ["a"], minimum: 2 },
          { values: ["b"], minimum: 1 },
          { values: ["0", "1"], minimum: 0 },
        ],
      },
      {
        length: 0,
        groups: [{ values: ["a"], minimum: 0 }],
      },
    ];

    for (const spec of specs) {
      expect(countConstrainedSequences(spec)).toBe(bruteForceCount(spec));
    }
  });

  it("handles long sequences without recursive call-stack growth", () => {
    const count = countConstrainedSequences({
      length: 1_000,
      groups: [
        { values: ["a"], minimum: 1 },
        { values: ["b"], minimum: 1 },
      ],
    });

    expect(count).toBe(2n ** 1_000n - 2n);
  });

  it("returns zero for impossible minimums", () => {
    expect(
      countConstrainedSequences({
        length: 2,
        groups: [
          { values: ["a"], minimum: 2 },
          { values: ["0"], minimum: 1 },
        ],
      }),
    ).toBe(0n);
  });

  it("returns zero when a required group has no values", () => {
    expect(
      countConstrainedSequences({
        length: 1,
        groups: [{ values: [], minimum: 1 }],
      }),
    ).toBe(0n);
  });
});

describe("sampleConstrainedSequence", () => {
  it("takes branches using their exact completion weights", () => {
    const source = new SequenceSource([0x00, 0x01]);
    const result = sampleConstrainedSequence(source, {
      length: 2,
      groups: [
        { values: ["a", "b"], minimum: 1 },
        { values: ["0"], minimum: 1 },
      ],
    });

    expect(result).toEqual(["b", "0"]);
  });

  it("always satisfies the requested minimums", () => {
    const source = new SequenceSource([
      0x03, 0x01, 0x02, 0x00, 0x01, 0x00, 0x02, 0x01,
    ]);
    const result = sampleConstrainedSequence(source, {
      length: 4,
      groups: [
        { values: ["a", "b"], minimum: 2 },
        { values: ["0", "1"], minimum: 1 },
      ],
    });

    const letters = result.filter((value) => value === "a" || value === "b").length;
    const digits = result.filter((value) => value === "0" || value === "1").length;

    expect(result).toHaveLength(4);
    expect(letters).toBeGreaterThanOrEqual(2);
    expect(digits).toBeGreaterThanOrEqual(1);
  });

  it("rejects unsatisfiable constraints before producing a result", () => {
    const source = new SequenceSource([]);

    expect(() =>
      sampleConstrainedSequence(source, {
        length: 1,
        groups: [
          { values: ["a"], minimum: 1 },
          { values: ["0"], minimum: 1 },
        ],
      }),
    ).toThrow(UnsatisfiableConstraintsError);
  });
});

describe("constraint validation", () => {
  it("rejects duplicate values across groups", () => {
    expect(() =>
      countConstrainedSequences({
        length: 2,
        groups: [
          { values: ["x"], minimum: 0 },
          { values: ["x"], minimum: 0 },
        ],
      }),
    ).toThrow(ConstraintConfigurationError);
  });

  it("rejects duplicate values inside a group", () => {
    expect(() =>
      countConstrainedSequences({
        length: 1,
        groups: [{ values: ["x", "x"], minimum: 0 }],
      }),
    ).toThrow(ConstraintConfigurationError);
  });

  it("rejects invalid lengths and minimums", () => {
    expect(() =>
      countConstrainedSequences({
        length: -1,
        groups: [],
      }),
    ).toThrow(ConstraintConfigurationError);

    expect(() =>
      countConstrainedSequences({
        length: 1,
        groups: [{ values: ["a"], minimum: -1 }],
      }),
    ).toThrow(ConstraintConfigurationError);
  });
});
