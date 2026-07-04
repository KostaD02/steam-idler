# Security Policy

Steam Idler is a self-hosted application, so most of the security depends on how you host it.
This document explains what the application does to protect your data and what is expected from you.

## Supported versions

Only the [latest release](https://github.com/KostaD02/steam-idler/releases) is supported.
If you found a vulnerability in an older version, please check if it still exists in the latest one before reporting.

## Reporting a vulnerability

If you find a vulnerability, please report it privately via [GitHub security advisories](https://github.com/KostaD02/steam-idler/security/advisories/new).
Please don't open a public issue for anything that could put other users at risk.

This project is maintained in free time, so there is no guaranteed response time, but reports are taken seriously and will be answered as soon as possible.

## How your data is protected

- Your Steam Idler account password is hashed with bcrypt and never stored in plain text.
- Steam refresh tokens and web session cookies are encrypted with AES-256-GCM using your `CREDENTIALS_SECRET`.
- TOTP secrets for two-factor authentication are stored encrypted, recovery codes are stored as bcrypt hashes and are single use.
- Your Steam password is never stored, it is only sent to Steam during sign-in.
- Sessions use `httpOnly`, `secure`, `sameSite: strict` cookies.

## Hosting recommendations

- Generate strong secrets with `pnpm g:secret` and never reuse or commit them.
- Put the application behind HTTPS, for example with a [reverse proxy](https://en.wikipedia.org/wiki/Reverse_proxy), a [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/) or a similar approach, credentials are sent during sign-in.
- Don't expose MongoDB or Redis to the internet, they should only be reachable by the server.
- Keep the application updated with the latest release.

> [!CAUTION]
> Anyone who can read your database and knows your `CREDENTIALS_SECRET` can decrypt the stored Steam tokens. Treat the `.env` file like a password.
