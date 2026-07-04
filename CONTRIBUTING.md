# Contributing

First of all, thanks for taking the time to contribute!

## How to start

First we need to clone the repository:

```
git clone https://github.com/KostaD02/steam-idler
```

Then install packages:

```
cd steam-idler
pnpm install
```

Create a `.env` file similar to `.env.example`. Generate values for `JWT_SECRET` and `CREDENTIALS_SECRET`:

```
pnpm g:secret
```

Start MongoDB and Redis, then start both applications:

```
pnpm db:up
pnpm start
```

Client runs on [http://localhost:2222](http://localhost:2222), server on [http://localhost:2221/api](http://localhost:2221/api), Swagger on [http://localhost:2221/api/swagger](http://localhost:2221/api/swagger).

## Useful scripts

- `pnpm start` - serve client and server together
- `pnpm start:client` / `pnpm start:server` - serve one of them
- `pnpm lint` / `pnpm lint:fix` - lint affected projects
- `pnpm format` - format everything with Prettier
- `pnpm validate:i18n` - check translation files against the code
- `pnpm build` - build everything into `dist/`
- `pnpm db:up` / `pnpm db:down` - start/stop MongoDB and Redis containers
- `pnpm docker:local:up` / `pnpm docker:local:down` - full local Docker stack

Tests run per project, for example:

```
pnpm exec nx test server-auth-feature
```

## File structure

The project is an [Nx](https://nx.dev/) monorepo.

- `apps`
  - `client` - Angular application (bootstrap and global styles only)
  - `server` - NestJS application (bootstrap only)
- `libs`
  - `client/<domain>/<type>` - client code (accounts, auth, dashboard, i18n, ...)
  - `server/<domain>/<type>` - server code (auth, steam-account, infra)
  - `infra` - shared code used by both sides
- `tools`
  - `generators` - custom Nx generators
  - `scripts` - build and validation scripts

The `<type>` describes the layer of the library:

- `feature` - routed components / controllers and services
- `data-access` - API services and state
- `domain` - schemas and repositories (server)
- `core` - pure helpers and constants
- `ui` - presentational components
- `types` - interfaces, enums, error keys
- `util` - small utilities

## Creating new libraries

Never create libraries by hand, always use the custom generators:

```
pnpm exec nx g @steam-idler/generators:angular-library <domain> --type=<type>
pnpm exec nx g @steam-idler/generators:nest-library <domain> --type=<type>
```

They scaffold the files, register the `@steam-idler/*` import alias and set up linting for you.

## Commits and pull requests

The project uses [conventional commits](https://www.conventionalcommits.org/), enforced by commitlint on every commit and on PR titles in CI.
PRs are squash merged, so the PR title becomes the commit on `main`.
Releases are triggered manually by the maintainer, and the version bump is derived from the conventional commits since the last release (`feat` = minor, `fix` = patch), so the titles still matter.

Before pushing, make sure the following pass:

```
pnpm lint
pnpm format:check
pnpm validate:i18n
```

CI runs lint, format check, unit tests, i18n validation and build on every PR.

## Keep in mind

- In the code, the `any` type isn't used so **let's keep it that way**. If something truly can't be typed, use `SafeAny` from `@steam-idler/infra` as a last resort, it exists exactly for that and keeps those places easy to find.
- New code should come with unit tests, check the neighboring `*.spec.ts` files for the style.
- Every user-facing error is an error key translated on the client. If you add a new key on the server, add its translation to `apps/client/public/i18n/*.json` and run `pnpm validate:i18n`.

### On the client

- Every component is standalone with `ChangeDetectionStrategy.OnPush` and the `si-` selector prefix.
- Always use signals for state: `input()` / `input.required()` for inputs, `output()` for outputs, `computed` for derived values. Services expose state as readonly signals via `.asReadonly()`, never as writable signals.
- Server data goes through `rxResource` or through an RxJS pipeline that ends up in a signal. The `async` pipe is fine too when it fits better.
- Don't assign observables to fields from the constructor or from other methods. Creating one as part of the field declaration is acceptable (`readonly data$ = this.api.get(...)`), reassigning it later is not.
- Keep `.subscribe()` empty and put the logic inside `pipe` operators (`tap`, `catchError`, `finalize`). Use `takeUntilDestroyed` for long-lived streams.
- Use the `inject()` function instead of constructor injection.
- Component styles use nested BEM (`&__element`, `&--modifier`) under the block selector.

### On the server

- Never throw exceptions directly, always go through `ExceptionService.throw` with proper error keys so the client can translate them.
- Database access only happens in repositories inside the `domain` libraries, services never touch Mongoose models directly.
- Controllers stay thin: input is validated with DTOs and `class-validator`, logic lives in services. Big domains hide their services behind a facade, check `AuthService` or `SteamAccountService` for the pattern.
- Sensitive data never leaves the database unprotected: passwords are hashed, Steam credentials are encrypted and schemas hide such fields with `select: false`.
