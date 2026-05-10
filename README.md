# Novenyek Backend

NestJS + Prisma backend for the NövényNapló / PlantCare Log project.

## Requirements

- Node.js 22+
- PostgreSQL 16+

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:deploy
npm run start:dev
```

Logging is controlled by `LOG_LEVEL`:

```env
LOG_LEVEL=error|warn|log|debug|verbose|silent
```

Frontend integration is controlled by `FRONTEND_URL`; it is used for CORS and
the Google auth callback redirect:

```env
FRONTEND_URL=http://localhost:5173
```

The session cookie is set by the backend response from
`/auth/callback/google`, not by the frontend page at `FRONTEND_URL`. Frontend
requests to the backend must include credentials, for example:

```ts
fetch('http://localhost:3000/graphql', {
  method: 'POST',
  credentials: 'include',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ query: '{ me { id email isEnabled isAdmin } }' }),
});
```

GraphQL status check:

```bash
curl -X POST http://localhost:3000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ apiStatus }"}'
```

## Step 1 Scope

- NestJS backend scaffold
- Prisma configured for PostgreSQL
- Environment variables documented in `.env.example`
- Basic `apiStatus` GraphQL query
- Docker Compose PostgreSQL service for local development

## Implemented API Scope

REST:

- `GET /auth/login/google`
- `GET /auth/callback/google`
- `GET /auth/me`
- `POST /auth/logout`

GraphQL:

- Queries: `apiStatus`, `me`, `users`, `rooms`, `room`, `plants`, `plant`, `plantRequirement`, `plantEvents`, `plantStatusReports`, `plantStatusReport`, `plantPhotos`, `plantStatusReportPhotos`, `plantAiAnalyses`, `aiAnalysis`, `dashboard`, `plantExportJson`, `plantExportMarkdown`
- Mutations: `updateUserEnabled`, `createRoom`, `updateRoom`, `deleteRoom`, `createPlant`, `updatePlant`, `deletePlant`, `upsertPlantRequirement`, `createPlantEvent`, `updatePlantEvent`, `deletePlantEvent`, `createPlantStatusReport`, `updatePlantStatusReport`, `deletePlantStatusReport`, `createPlantPhotoFromBase64`, `deletePlantPhoto`, `createAiAnalysis`

Domain endpoints require an authenticated session where the user is enabled or
matches `ADMIN_EMAIL`. New Google users are created with `isEnabled=false`;
admins can enable users through GraphQL:

```graphql
query {
  users {
    id
    email
    displayName
    isEnabled
    isAdmin
  }
}
```

```graphql
mutation {
  updateUserEnabled(input: { id: "user-id", isEnabled: true }) {
    id
    email
    isEnabled
  }
}
```

Generated API docs:

```bash
npm run docs:generate
```
