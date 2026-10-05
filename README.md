# pfx-password-core

Security-focused TypeScript core for password and passphrase generation.

> Status: early development. Secure randomness, the exact constrained sampler,
> password generation, and passphrase generation are implemented. Entropy,
> batch, and policy layers are still in progress.

## Design goals

- cryptographically secure randomness from Web Crypto;
- unbiased bounded sampling using rejection sampling;
- exact uniform sampling under minimum-group constraints;
- exact password and passphrase search-space counting with `BigInt`;
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

### Password engine

The `src/password` layer currently supports:

- lowercase, uppercase, digits, and all 32 printable ASCII punctuation symbols;
- independent minimum counts for each enabled group;
- exclusion of ambiguous characters `0 O 1 l I`;
- arbitrary additional character exclusions;
- exact search-space counting through the constrained sampler;
- direct uniform generation from the complete valid search space;
- rejection of inconsistent options such as positive minimums on disabled groups.

The implementation does not generate mandatory characters separately and then
shuffle them. Passwords are sampled directly from the mathematically defined
valid space.

### Passphrase engine

The `src/passphrase` layer currently supports:

- caller-supplied external wordlists;
- uniform ordered word selection with replacement;
- custom non-empty separators;
- deterministic capitalization without adding fake entropy;
- optional uniformly selected decimal-number token;
- optional uniformly selected symbol token;
- exact `BigInt` search-space counting;
- validation that preserves an injective text representation.

The core intentionally contains no bundled wordlist. EFF, BIP39, language
lists, or project-specific lists can be distributed separately with their own
license and attribution.

Passphrase v1 requires the separator to be non-empty and absent from every
transformed word. It also rejects duplicate words after deterministic
transformations. Those rules ensure that distinct generation paths cannot
collapse into the same output while the core reports them as separate
combinations.

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
