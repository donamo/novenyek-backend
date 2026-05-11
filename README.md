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

## AI Configuration

OpenAI usage is controlled by `AI_PROVIDER`, `AI_MODEL`, and
`OPENAI_MODEL_TIER`.

```env
AI_PROVIDER=openai
AI_MODEL=
OPENAI_MODEL_TIER=medium
OPENAI_API_KEY=your-openai-api-key
OPENAI_PROJECT_ID=your-openai-project-id
OPENAI_ORG_ID=
```

Rules:

- If `AI_MODEL` is set, the backend uses that exact OpenAI model.
- If `AI_MODEL` is empty and `AI_PROVIDER=openai`, the backend resolves the
  model from `OPENAI_MODEL_TIER`.
- Supported tiers: `cheap`, `medium`, `expensive`.

Current tier mapping:

- `cheap` -> `gpt-5.4-nano`
- `medium` -> `gpt-5.4-mini`
- `expensive` -> `gpt-5.5`

Environment defaults in this project:

- local development: `OPENAI_MODEL_TIER=medium` in `.env.example`
- e2e test env: `OPENAI_MODEL_TIER=cheap` in `.env.test`

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
