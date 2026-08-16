# Security policy

## Reporting

Do not open a public issue for a suspected vulnerability. Contact the repository
maintainers privately and include the affected component, reproduction steps,
impact, and any safe mitigation. Avoid accessing data that is not yours.

## Supported versions

This portfolio project currently supports the latest `main` branch. No hosted
production service or long-term support release is claimed.

## Security design notes

- Passwords are hashed with the recommended Argon2 profile from `pwdlib`.
- JWTs are short-lived and signed with an environment-provided secret.
- Pydantic bounds all public API payloads.
- Uploads are limited to CSV/JSON and 25 MB, stored under generated object keys,
  and checksummed before processing.
- Raw, quarantine, staging, analytics, and serving responsibilities are
  separated.
- Compose defaults are local-development values only and must be changed for any
  shared environment.

Before production use, complete the roadmap items for secret management,
database migrations, object-store deletion/retention, rate limits, audit logs,
dependency scanning, and an external penetration test.
