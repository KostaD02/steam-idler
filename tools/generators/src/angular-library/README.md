# Angular Library Generator

Create Angular libraries with pre-defined types for consistent organization.

## Usage

```bash
nx g @steam-idler/generators:angular-library <domain> --type=<type> [--subname=<subname>] [--directory=client]
```

Or open Nx Console → **Generate** → `tools/generators/angular-library`.

## Library Types

| Type          | Folder                                             | Purpose                                                                                        |
| ------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `shell`       | `<domain>/shell`                                   | Lazy-load entrypoint: domain routes, providers, route guards.                                  |
| `feature`     | `<domain>/feature` or `<domain>/feature-<subname>` | Smart components / page-level containers. Use `--subname` when a domain has multiple features. |
| `ui`          | `<domain>/ui` or `<domain>/ui-<subname>`           | Dumb presentational components, pipes, directives.                                             |
| `data-access` | `<domain>/data-access`                             | Services, HTTP clients, stores, interceptors.                                                  |
| `core`        | `<domain>/core`                                    | Cross-cutting Angular pieces (tokens, base classes, error handlers).                           |
| `types`       | `<domain>/types`                                   | Shared TypeScript types / interfaces. Zero Angular deps.                                       |
| `util`        | `<domain>/util`                                    | Pure helpers, validators, framework-free utilities.                                            |

## Architecture

```
apps/client/src/app/app.routes.ts
  └── loadChildren: () => import('@steam-idler/client/auth/shell').then(m => m.authRoutes)

libs/client/auth/
  ├── shell/                 ← Routes + provide*() - only this is imported by the app
  ├── feature-login/         ← LoginComponent
  ├── feature-register/      ← RegisterComponent
  ├── data-access/           ← AuthService, AuthStore (shared by features)
  ├── ui/                    ← Reusable dumb components (AuthCard, PasswordInput)
  ├── types/
  └── util/
```

Single-feature domains skip `shell` and stick with one unsuffixed `feature`:

```
libs/client/settings/
  ├── feature/               ← The single settings page
  ├── data-access/
  └── types/
```

## Examples

```bash
# Single-feature domain
nx g @steam-idler/generators:angular-library settings --type=feature

# Multi-feature domain
nx g @steam-idler/generators:angular-library auth --type=shell
nx g @steam-idler/generators:angular-library auth --type=feature --subname=login
nx g @steam-idler/generators:angular-library auth --type=feature --subname=register
nx g @steam-idler/generators:angular-library auth --type=data-access
nx g @steam-idler/generators:angular-library auth --type=types

# UI library split
nx g @steam-idler/generators:angular-library shared --type=ui --subname=button
```

## Options

- `name` (required) - Domain name (e.g. `auth`)
- `type` (required) - One of `core`, `data-access`, `types`, `ui`, `util`, `shell`, `feature`
- `subname` - Sub-name appended to the type folder (e.g. `login` → `feature-login`)
- `directory` - Top-level dir under `libs/` (default: `client`)
- `prefix` - Selector prefix for generated components (default: `app`)
- `tags` - Comma-separated additional tags
- `buildable` / `publishable` / `importPath` / `skipFormat`
