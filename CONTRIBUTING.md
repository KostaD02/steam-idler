## How to start

First we need to clone repository.

```
git clone https://github.com/KostaD02/steam-idler
```

Then need to install packages:

```
cd steam-idler
npm ci
```

Create `.env` file similar to `.env.example`, for example:

```
PORT = 2222
HIDE_LOGS = false
DATABASE_URL = mongodb://127.0.0.1:27017/steam-idler
```

## File structure

The current structure is based on NestJS best practices.

- modules
  - auth
  - idle
  - persona
  - user
- schemas
- shared
  - consts
  - dtos
  - modules
  - services
  - types

If it is necessary to create new endpoints, update modules, or add new subfolders, please do so accordingly.

## Keep in mind

In the code, the `any` type isn't used so **let's keep it that way**.
