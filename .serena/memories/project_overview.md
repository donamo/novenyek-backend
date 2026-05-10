# Project Overview

`novenyek-backend` is the NestJS/TypeScript backend for the NövényNapló / PlantCare Log project. It tracks household plants, rooms, plant requirements, events/history, monthly status reports, photos, and mock AI plant image analysis.

Current architecture:
- Node.js 22+ target, TypeScript, NestJS 11.
- GraphQL-first domain API via Apollo/Nest GraphQL at `/graphql`.
- REST is reserved for auth only: Google OAuth/OpenID login/callback, `/auth/me`, `/auth/logout`.
- Prisma + PostgreSQL with migrations in `prisma/migrations`.
- Session auth with Passport, `express-session`, and `connect-pg-simple` Postgres session store.
- Google OAuth users are stored in `User`; new users default to `isEnabled=false`; `ADMIN_EMAIL` grants admin privileges independent of `isEnabled`.
- All domain records are scoped by `ownerUserId` and service-level owner checks.
- Photos are uploaded through GraphQL as base64 via `createPlantPhotoFromBase64`; Sharp creates thumbnails.
- API docs are generated to `docs/generated/schema.graphql` and `docs/generated/openapi.yaml`.

Key folders:
- `src/auth`: Google auth, sessions, guards, current-user decorator.
- `src/users`: admin GraphQL user whitelist management.
- `src/rooms`, `src/plants`, `src/plant-*`: domain modules with GraphQL resolvers, DTO inputs, models, and services.
- `src/ai-analysis`: mock AI provider and analysis persistence.
- `src/dashboard`, `src/export`: GraphQL dashboard and export queries.
- `src/common`: shared DTO helpers, Prisma exception filter, GraphQL enum/model helpers.
- `scripts/generate-api-docs.ts`: GraphQL/OpenAPI doc generator.