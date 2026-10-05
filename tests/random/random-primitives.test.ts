import { describe, expect, it } from "vitest";

import {
  randomBytes,
  securePick,
  secureShuffle,
  uniformBigInt,
  uniformInt,
  type RandomSource,
} from "../../src/random/index.js";

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

describe("randomBytes", () => {
  it("fills exactly the requested number of bytes", () => {
    const source = new SequenceSource([1, 2, 3]);

    expect([...randomBytes(source, 3)]).toEqual([1, 2, 3]);
  });

  it("rejects invalid lengths", () => {
    const source = new SequenceSource([]);

    expect(() => randomBytes(source, -1)).toThrow(RangeError);
    expect(() => randomBytes(source, 1.5)).toThrow(RangeError);
  });
});

describe("uniformBigInt", () => {
  it("rejects candidates outside the range instead of using modulo", () => {
    const source = new SequenceSource([0xff, 0x07]);

    expect(uniformBigInt(source, 0n, 10n)).toBe(7n);
  });

  it("supports ranges larger than Number.MAX_SAFE_INTEGER", () => {
    const source = new SequenceSource([0, 0, 0, 0, 0, 0, 0, 1]);
    const max = 1n << 64n;

    expect(uniformBigInt(source, 0n, max)).toBe(1n);
  });

  it("returns the only possible value without consuming randomness", () => {
    const source = new SequenceSource([]);

    expect(uniformBigInt(source, 12n, 13n)).toBe(12n);
  });
});

describe("uniformInt", () => {
  it("samples inside a signed safe-integer range", () => {
    const source = new SequenceSource([0x06]);

    expect(uniformInt(source, -3, 4)).toBe(3);
  });

  it("rejects invalid ranges", () => {
    const source = new SequenceSource([]);

    expect(() => uniformInt(source, 1, 1)).toThrow(RangeError);
    expect(() => uniformInt(source, 0.5, 2)).toThrow(RangeError);
  });
});

describe("securePick", () => {
  it("uses the injected source", () => {
    const source = new SequenceSource([0x02]);

    expect(securePick(source, ["a", "b", "c", "d"])).toBe("c");
  });

  it("rejects an empty collection", () => {
    const source = new SequenceSource([]);

    expect(() => securePick(source, [])).toThrow(RangeError);
  });
});

describe("secureShuffle", () => {
  it("returns a new array containing the same values", () => {
    const source = new SequenceSource([0, 0, 0]);
    const input = ["a", "b", "c", "d"];
    const output = secureShuffle(source, input);

    expect(output).toEqual(["b", "c", "d", "a"]);
    expect(input).toEqual(["a", "b", "c", "d"]);
  });
});
