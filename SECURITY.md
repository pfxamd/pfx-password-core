# Security Policy

## Scope

Security reports are especially important for:

- biased or predictable random generation;
- incorrect range sampling;
- entropy or search-space miscalculation;
- secret persistence or accidental exposure;
- unsafe behavior across supported runtimes.

## Reporting

For vulnerabilities that could expose generated secrets or weaken generation,
use GitHub private vulnerability reporting when it is available for this
repository. Do not publish exploit details in a public issue before a fix is
available.

Non-sensitive hardening suggestions and test improvements may be reported
through normal GitHub issues.

## Security model

The core is intended to generate secrets locally. It must not require network
access, analytics, persistence, or telemetry to generate a secret.
