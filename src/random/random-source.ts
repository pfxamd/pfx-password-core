/**
 * Minimal entropy-source contract used by the core.
 *
 * Production code uses WebCryptoRandomSource. Tests may inject deterministic
 * sources without exposing deterministic generation through the public API.
 */
export interface RandomSource {
  fill(target: Uint8Array): void;
}
