# Changelog

All notable changes to this project will be documented in this file.

The project follows semantic versioning once releases are published. Pre-1.0
interfaces may still change as the security model and public API mature.

## 0.1.1 - 2026-10-06

### Fixed

- Added an npm `prepare` lifecycle script so direct GitHub installations build
  the generated `dist/` entry points automatically.
- Added a consumer smoke test that packs the library, installs it into an
  isolated temporary project, and imports the public API from the installed
  package.
- CI now verifies that a clean checkout with no `dist/` directory recreates
  the build during dependency installation.

## 0.1.0 - 2026-10-06

### Added

- Web Crypto-backed `RandomSource` with chunk-safe random byte generation.
- Unbiased integer and BigInt sampling using rejection sampling.
- Exact uniform constrained-sequence sampling.
- Password generation with configurable character groups, exclusions, and
  per-group minimums.
- Passphrase generation from caller-supplied wordlists.
- Exact generation search-space and entropy analysis.
- Batch password and passphrase generation with isolated random-source objects.
- Configurable recommendation and compatibility policy evaluation.
- Public package API with Web Crypto defaults and injectable randomness for
  advanced callers and deterministic tests.
- Node.js verification on versions 22, 24, and 26.
- Real Chromium tests for browser Web Crypto behavior.
- Apache-2.0 licensing and third-party attribution.

### Security notes

- `Math.random()` is forbidden by lint policy.
- No runtime network, telemetry, analytics, persistence, or storage dependency.
- Password length and batch sizes are bounded for operational safety.
- No bundled passphrase wordlist is included.
- This release has not undergone an independent security audit.
