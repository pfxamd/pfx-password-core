import type { RandomSource } from "./random-source.js";

export const WEB_CRYPTO_MAX_BYTES = 65_536;

export interface WebCryptoProvider {
  getRandomValues<T extends Uint8Array>(array: T): T;
}

/**
 * RandomSource backed by Web Crypto.
 *
 * getRandomValues() accepts at most 65,536 bytes per call, so larger buffers
 * are filled in bounded chunks.
 */
export class WebCryptoRandomSource implements RandomSource {
  readonly #provider: WebCryptoProvider;

  constructor(provider: WebCryptoProvider = globalThis.crypto as WebCryptoProvider) {
    if (provider === undefined || typeof provider.getRandomValues !== "function") {
      throw new Error("Web Crypto getRandomValues() is not available in this runtime.");
    }

    this.#provider = provider;
  }

  fill(target: Uint8Array): void {
    for (let offset = 0; offset < target.length; offset += WEB_CRYPTO_MAX_BYTES) {
      const end = Math.min(offset + WEB_CRYPTO_MAX_BYTES, target.length);
      this.#provider.getRandomValues(target.subarray(offset, end));
    }
  }
}
