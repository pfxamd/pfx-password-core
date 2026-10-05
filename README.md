# pfx-password-core

Security-focused TypeScript core for password and passphrase generation.

> Status: early development. Secure randomness, exact constrained sampling,
> password and passphrase generation, generation-entropy analysis, isolated batch
> generation, policy evaluation, and the initial public API are implemented.

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

### Batch engine

The `src/batch` layer supports bounded multi-secret generation:

- each result receives a distinct `RandomSource` object from a caller-supplied
  factory;
- reused source objects are rejected before any secret is generated;
- password and passphrase options are preflight-validated before generation;
- duplicate generated values are preserved rather than deduplicated, avoiding
  distribution bias;
- no history, cache, persistence, or telemetry is maintained;
- batch size is bounded to `10000` results per call.

The factory contract provides isolation at the JavaScript object level. A
factory remains responsible for returning independently owned sources; the core
cannot inspect hidden implementation state inside a custom source.

### Policy layer

The `src/policy` layer keeps recommendations separate from generator validity:

- entropy targets are caller-configured advisories rather than hidden hard rules;
- target-system composition requirements are modeled as compatibility policy;
- compatibility checks verify what the generator guarantees, not what an output
  will merely contain with high probability;
- policy findings use stable machine-readable codes and structured metadata;
- malformed policy configuration is rejected explicitly;
- default generator options do not treat uppercase, digits, or symbols as
  universal security requirements.

The core intentionally does not define a universal entropy threshold. Applications
can choose a target appropriate to their threat model and use case.

### Entropy engine

The `src/entropy` layer derives generation entropy from the exact search space:

- `combinations` remains an exact `BigInt`;
- `bits` is defined as `log2(combinations)`;
- `floorBits` is computed exactly;
- very large search spaces are handled without converting the full `BigInt`
  into a JavaScript `Number`;
- unsatisfiable password configurations are rejected rather than assigned a
  misleading strength value.

Entropy in this layer describes the known uniform generation process. It is not
a guessability estimate for human-chosen passwords.

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

## Public API

The package root exposes the supported v1-facing surface while keeping the
constraint sampler and implementation details internal.

Normal generation uses Web Crypto automatically:

```ts
import {
  generatePassword,
  generatePassphrase,
  generatePasswordBatch,
  analyzePasswordGenerationEntropy,
  evaluatePasswordPolicy,
} from "pfx-password-core";

const password = generatePassword({
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
});

const passphrase = generatePassphrase(
  { words: myExternalWordlist },
  {
    wordCount: 6,
    separator: "-",
  },
);

const batch = generatePasswordBatch(10, {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
});

const entropy = analyzePasswordGenerationEntropy({
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
});

const policy = evaluatePasswordPolicy(
  {
    length: 20,
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: true,
  },
  {
    recommendation: {
      minimumEntropyBits: 128,
    },
  },
);
```

Advanced callers and tests may inject a custom `RandomSource`. The production
default remains `WebCryptoRandomSource`.

## Development

Requires Node.js 22 or newer and npm 11 for development.

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
