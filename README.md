<h1 align="center">Steam Idler</h1>

<p align="center">
  <img src="./apps/client/public/steam-idler.png" alt="steam-idler-logo" width="240px" height="240px"/>
  <br>
  <em>open-source idling application.</em>
</p>

<p align="center">
  <a href="CONTRIBUTING.md">Contributing Guidelines</a>
  ·
  <a href="https://github.com/KostaD02/steam-idler/issues">Submit an Issue</a>
  <br>
</p>

<p align="center">
  <a href="https://github.com/KostaD02/steam-idler/actions/workflows/ci.yml"><img src="https://github.com/KostaD02/steam-idler/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

<h2>Table of contents</h2>

- [Introduction](#introduction)
- [Features](#features)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [How to set up](#how-to-set-up)
- [How does it work](#how-does-it-work)
- [Development](#development)
- [Usage](#usage)
- [Project architecture](#project-architecture)
- [Contributing](#contributing)
- [Issues](#issues)
- [Security and privacy](#security-and-privacy)
- [Logs](#logs)
- [To Do](#to-do)

## Introduction

Steam Idler is a self-hosted application for Steam game idling.
It can idle as many games as you want on as many accounts as you want.
It's great for farming cards or increasing game hours.

The application is built for self-hosting, there is no official hosted instance.
You run it on your own machine and your data stays with you.

This is the second generation of the project, rewritten from scratch.
The previous version is kept at [steam-idler-legacy](https://github.com/KostaD02/steam-idler-legacy) for reference.

## Features

- Simple managing UI
- Parallel multi-account idling
- Idling multiple games in parallel
- Sign in to Steam with credentials or by scanning a QR code
- Managing Steam persona status while idling
- Custom message replies while idling
- Custom game display while idling
- Trading card drops overview per account
- Optional two-factor authentication (TOTP) for your Steam Idler account
- Translations (English, ქართული, Español, Deutsch, Português (Brasil), Українська, Türkçe, Français, Polski, Русский, 简体中文)
- Light and dark theme
- Docker support

## Getting started

See instructions to run Steam Idler below.

### Prerequisites

- [Docker](https://www.docker.com/)

That's all you need to run it.
For local development check the [Development](#development) section.

### How to set up

The application can be easily set up using Docker Compose:

```
mkdir steam-idler
cd steam-idler
curl -o docker-compose.yml https://raw.githubusercontent.com/KostaD02/steam-idler/main/docker-compose.yml
```

```
docker compose up -d
```

> [!NOTE]
> That was it, you are ready to use it!

> [!CAUTION]
> The compose file ships with default secrets so it works out of the box.
> If the application is reachable by anyone but you, override `JWT_SECRET` and `CREDENTIALS_SECRET` in a `.env` file next to `docker-compose.yml`.

## How does it work

The first question might be: Is it safe?
Yes, this application uses the [steam-user](https://www.npmjs.com/package/steam-user) and [steam-session](https://www.npmjs.com/package/steam-session) packages, which allow interaction with the Steam API through Node.js.

To start idling for an account, you need to sign it in first. There are two ways:

- Username, password and two-factor authentication code
- Scanning a QR code with the Steam mobile app

After the authorization process, your data will be saved on your machine using MongoDB. This data does not include your **password**.
The following will be saved after authorization:

- `steamId`
- `steamCookies`
- `steamRefreshToken`

Cookies and the refresh token are encrypted with AES-256-GCM using your `CREDENTIALS_SECRET` before they touch the database.
You can review exactly what is stored by checking this [file](./libs/server/steam-account/domain/src/lib/steam-account.schema.ts).
This data is required to prevent the need to log in again whenever the server is stopped or restarted.

> [!CAUTION]
> Since your password is sent during the sign-in process, it is recommended to put the application behind HTTPS in your hosted environment, for example with a [reverse proxy](https://en.wikipedia.org/wiki/Reverse_proxy), a [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/) or a similar approach.

## Development

You will need [Node.js](https://nodejs.org/) 20+, [pnpm](https://pnpm.io/) 9 and [Docker](https://www.docker.com/).

First we need to clone the repository and install packages:

```
git clone https://github.com/KostaD02/steam-idler
cd steam-idler
pnpm install
```

Create a `.env` file similar to `.env.example` and generate the secrets:

```
pnpm g:secret
```

Run it twice and paste the values into `JWT_SECRET` and `CREDENTIALS_SECRET`.

Then start the database containers:

```
pnpm db:up
```

> [!NOTE]
> If you don't want to run Redis, set `REDIS_ENABLED=false` in `.env` and an in-memory cache is used instead.

After that, run the following script in the terminal:

```
pnpm start
```

It serves both applications: client on [http://localhost:2222](http://localhost:2222) and server on [http://localhost:2221/api](http://localhost:2221/api).
Swagger is available at [http://localhost:2221/api/swagger](http://localhost:2221/api/swagger).

To run the whole stack (client, server, MongoDB, Redis) from source with Docker:

```
pnpm docker:local:up
```

## Usage

Just open the browser and type `ip:port` of the machine running Steam Idler (port `2222` by default).
The first registered user becomes the admin.

## Project architecture

The project is an [Nx](https://nx.dev/) monorepo.

- Server side:
  - [NestJS](https://nestjs.com/)
  - [MongoDB](https://www.mongodb.com/)
  - [Redis](https://redis.io/) (optional cache)
- Client side:
  - [Angular](https://angular.dev/)

Applications live in `apps/`, all real code lives in `libs/` split by scope, domain and type.
Check the [contributing page](CONTRIBUTING.md) for the full structure.

## Contributing

I will add new features when I have time, but you don't have to wait, feel free to add them yourself! Fork the project and submit [pull requests](https://github.com/KostaD02/steam-idler/pulls).
Check more details at the [contributing page](CONTRIBUTING.md).

## Issues

If you see any [issues](https://github.com/KostaD02/steam-idler/issues), feel free to open an issue or suggest a [pull request](https://github.com/KostaD02/steam-idler/pulls).

## Security and privacy

Steam Idler is self-hosted, your data stays on your machine and is never sent anywhere else.
Check the [security policy](SECURITY.md) and the [privacy policy](PRIVACY_POLICY.md) for details.

## Logs

When running with Docker, you can easily check what's happening in background processes by running this script:

```
docker logs steam-idler-server --follow
```

Log verbosity is controlled by `SERVER_LOG_TYPE` and `CLIENT_LOG_TYPE` in `.env` (0 = none, 1 = errors only, 2 = all).

## To Do

Here are a few ideas that will be implemented in the future.
You can also open an issue for any of these ideas.

- End-to-end tests
