# pfx-password-core

Security-focused TypeScript core for password and passphrase generation.

> Status: early development. The secure random layer and exact constrained
> sequence sampler exist; password, passphrase, entropy, and batch engines are
> not yet released.

## Design goals

- cryptographically secure randomness from Web Crypto;
- unbiased bounded sampling using rejection sampling;
- exact uniform sampling under minimum-group constraints;
- framework-independent core with zero runtime dependencies;
- browser and Node.js support;
- no storage, analytics, telemetry, or network requirement for generation;
- explicit constraints and mathematically defined generation behavior;
- provenance and licensing kept visible for adapted open-source work.

## Current foundation

### Secure random layer

The `src/random` layer contains:

- `RandomSource` abstraction;
- `WebCryptoRandomSource`;
- `randomBytes()`;
- `uniformInt()`;
- `uniformBigInt()`;
- `securePick()`;
- `secureShuffle()`.

### Uniform constrained sampler

The `src/constraints` layer can:

- model disjoint value groups with minimum occurrence counts;
- count the exact number of valid sequences with `BigInt`;
- return `0n` for mathematically unsatisfiable constraints;
- sample uniformly from the complete valid search space;
- reject overlapping values that would make group ownership ambiguous;
- avoid recursive call-stack growth for long sequences;
- cap memoized DP states to prevent unbounded resource use.

For a valid search space of size `N`, each generated sequence has probability
exactly `1 / N` under an unbiased `RandomSource`.

The package root intentionally exposes no stable public API yet. Public exports
will be frozen only after the password, passphrase, constraints, and entropy
contracts are finalized.

## Development

Requires Node.js 20 or newer.

```bash
npm install
npm run check
```

Individual commands:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

## Security principles

`Math.random()` is not permitted in secret generation.

Bounded random integers are sampled without modulo bias. Randomness is injected
through `RandomSource` so deterministic sources can be used in tests without
adding deterministic secret generation to the production API.

Generated secrets must remain local to the caller. Storage and history are not
responsibilities of this core.

## License

The project is licensed under Apache-2.0.

See `THIRD_PARTY_NOTICES.md` for attribution related to incorporated or
adapted open-source work.
