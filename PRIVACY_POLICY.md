# Privacy Policy

Steam Idler is a self-hosted application.
There is no telemetry, no analytics and no data collection of any kind.
Everything the application stores lives in your own MongoDB database, on your own machine.

## What is stored

For your Steam Idler account:

- Email and display name
- Password as a bcrypt hash
- Profile settings (privacy toggles)
- If two-factor authentication is enabled: the encrypted TOTP secret and hashed one-time recovery codes

For every linked Steam account:

- `steamId`
- Steam profile name and avatar URL
- Idle settings (games, persona status, auto-reply configuration)
- Encrypted refresh token and web session cookies

Your Steam **password is never stored**, it is only sent to Steam during the sign-in process.
You can review exactly what is stored by checking the [user schema](./libs/server/auth/domain/src/lib/auth.schema.ts) and the [steam account schema](./libs/server/steam-account/domain/src/lib/steam-account.schema.ts).

## Who your data is shared with

Nobody.
The server only communicates with Steam itself (signing in, idling, reading badge pages for card drops).
No other third party is contacted.

## Browser storage

The client stores in your browser:

- `httpOnly` cookies for the session (access, refresh and pending MFA tokens)
- Theme, language and a session flag in local storage
- Cached translation files in IndexedDB

## Deleting your data

- Removing a Steam account deletes its stored credentials and settings.
- Deleting your Steam Idler account deletes your user data.
- Since you own the database, you can always drop it entirely.

## Changes

This policy may change as the application evolves, any change will be visible in the repository history.
