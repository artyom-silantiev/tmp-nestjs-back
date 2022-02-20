## Description

Backend system, for the base nestjs project.
System components:

- server - rest api

External components:

...

## Run for backend dev

```bash
$ docker-compose up
```

## Deploy for production

```bash
# .env file
$ cd <this folder>
$ cp .env.default .env
$ nano .env

# [OPTIONAL] docker for db, redis, s3
$ docker-compose up -d

# db migrates
$ npx prisma migrate deploy

# deploy apps
$ cp pm2.config.default.js pm2.config.js
$ nano pm2.config.js
$ pm2 start pm2.config.js

# traefik
$ yarn cli:cluster:list
$ yarn cli:cluster:update_traefik_config
$ sudo traefik ./traefik/traefik.yml
```

## Build main app

```bash
$ cd <this folder>
$ sh build_frontend_main.sh
```

## Running the app

```bash
# development
$ yarn start:web

# watch mode
$ yarn start:web:dev

# production mode
$ yarn start:web:prod
```

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

# prisma orm commands

## create migration only

```sh
npx prisma migrate dev --name <name> --create-only
```

## apply not used migrations

```sh
npx prisma migrate dev
```

## create and apply migration (!!!)

```sh
npx prisma migrate dev --name <name>
```

## prisma generate (update types)

```sh
npx prisma generate
```

## prisma reset (ONLY FOR DEV!!!(!!!)) (drop and recreate db from migrations)

```sh
npx prisma migrate reset
```

## migrations docs

https://www.prisma.io/docs/concepts/components/prisma-migrate
https://www.prisma.io/docs/guides/application-lifecycle/developing-with-prisma-migrate/advanced-migrate-scenarios

## Devs commands

```sh

```

## Ports in project

- web: 3000 - 3099
