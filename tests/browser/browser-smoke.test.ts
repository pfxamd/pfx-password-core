import { describe, expect, it } from "vitest";

import {
  generatePassphrase,
  generatePassword,
  WebCryptoRandomSource,
} from "../../src/index.js";

describe("browser runtime", () => {
  it("uses the browser Web Crypto implementation", () => {
    expect(globalThis.crypto).toBeDefined();
    expect(typeof globalThis.crypto.getRandomValues).toBe("function");

    const bytes = new Uint8Array(32);
    new WebCryptoRandomSource().fill(bytes);

    expect(bytes).toHaveLength(32);
  });

  it("generates a constrained password with the production source", () => {
    const password = generatePassword({
      length: 32,
      lowercase: true,
      uppercase: true,
      digits: true,
      symbols: true,
      minLowercase: 1,
      minUppercase: 1,
      minDigits: 1,
      minSymbols: 1,
    });

    expect([...password]).toHaveLength(32);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[^A-Za-z0-9]/);
    expect(password).toMatch(/^[!-~]+$/);
  });

  it("generates a passphrase from an external wordlist in Chromium", () => {
    const words = ["alpha", "bravo", "charlie", "delta"];

    const passphrase = generatePassphrase(
      { id: "browser-smoke", words },
      {
        wordCount: 4,
        separator: "-",
      },
    );

    const tokens = passphrase.split("-");

    expect(tokens).toHaveLength(4);
    expect(tokens.every((token) => words.includes(token))).toBe(true);
  });
});
