# Task Completion Checklist

Before finishing backend code changes:
1. Run Prisma validation when schema or Prisma client usage changed:
```bash
npm run prisma:validate
npm run prisma:generate
```
2. Run build and lint:
```bash
npm run build
npm run lint
```
3. Run e2e tests:
```bash
npm run test:e2e
```
4. Regenerate docs when GraphQL resolvers/DTOs/auth routes change:
```bash
npm run docs:generate
```
5. If Prisma schema changed, add/update migration and apply when requested/appropriate:
```bash
npm run prisma:deploy
```
6. For final smoke check after auth/session/app wiring changes, start the app and query GraphQL `apiStatus` if feasible:
```bash
npm run start
curl -X POST http://localhost:3000/graphql -H 'content-type: application/json' -d '{"query":"{ apiStatus }"}'
```
Then stop the server process.

Always mention any commands that could not be run and why. If the DB/network requires sandbox escalation, request it for Prisma deploy or live smoke checks.