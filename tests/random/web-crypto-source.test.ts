import { describe, expect, it } from "vitest";

import {
  WEB_CRYPTO_MAX_BYTES,
  WebCryptoRandomSource,
  type WebCryptoProvider,
} from "../../src/random/index.js";

describe("WebCryptoRandomSource", () => {
  it("chunks requests larger than the Web Crypto per-call limit", () => {
    const callSizes: number[] = [];

    const provider: WebCryptoProvider = {
      getRandomValues<T extends Uint8Array>(array: T): T {
        callSizes.push(array.length);
        array.fill(0xa5);
        return array;
      },
    };

    const source = new WebCryptoRandomSource(provider);
    const target = new Uint8Array(WEB_CRYPTO_MAX_BYTES + 17);

    source.fill(target);

    expect(callSizes).toEqual([WEB_CRYPTO_MAX_BYTES, 17]);
    expect(target[0]).toBe(0xa5);
    expect(target.at(-1)).toBe(0xa5);
  });
});
