import { describe, expect, it } from "vitest";

import {
  MAX_BATCH_COUNT,
  BatchConfigurationError,
  generateBatch,
  generatePassphraseBatch,
  generatePasswordBatch,
} from "../../src/batch/index.js";
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

describe("generateBatch", () => {
  it("provides an independent source and stable index to each item", () => {
    const result = generateBatch(
      (index) => new SequenceSource([index]),
      3,
      (_source, index) => index,
    );

    expect(result).toEqual([0, 1, 2]);
  });

  it("rejects reuse of the same RandomSource before generation starts", () => {
    const reused = new SequenceSource([0]);
    let generated = 0;

    expect(() =>
      generateBatch(
        () => reused,
        2,
        () => {
          generated += 1;
          return "secret";
        },
      ),
    ).toThrow(BatchConfigurationError);

    expect(generated).toBe(0);
  });

  it("preserves duplicate outputs instead of biasing distribution with deduplication", () => {
    const result = generateBatch(
      () => new SequenceSource([0]),
      3,
      () => "same",
    );

    expect(result).toEqual(["same", "same", "same"]);
  });

  it("bounds batch size", () => {
    expect(() =>
      generateBatch(
        () => new SequenceSource([0]),
        0,
        () => "x",
      ),
    ).toThrow(BatchConfigurationError);

    expect(() =>
      generateBatch(
        () => new SequenceSource([0]),
        MAX_BATCH_COUNT + 1,
        () => "x",
      ),
    ).toThrow(BatchConfigurationError);
  });
});

describe("generatePasswordBatch", () => {
  it("generates passwords with a fresh source per result", () => {
    const result = generatePasswordBatch(
      (index) => new SequenceSource([0, index]),
      3,
      {
        length: 1,
        lowercase: true,
        uppercase: false,
        digits: false,
        symbols: false,
      },
    );

    expect(result).toEqual(["a", "b", "c"]);
  });
});

describe("generatePassphraseBatch", () => {
  it("generates passphrases with a fresh source per result", () => {
    const result = generatePassphraseBatch(
      (index) => new SequenceSource([index]),
      3,
      {
        words: ["alpha", "beta", "gamma"],
      },
      {
        wordCount: 1,
        separator: "-",
      },
    );

    expect(result).toEqual(["alpha", "beta", "gamma"]);
  });
});
