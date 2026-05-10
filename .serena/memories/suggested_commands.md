# Suggested Commands

Development setup:
```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:deploy
npm run start:dev
```

Run app:
```bash
npm run start:dev      # watch mode
npm run start          # run built dist/main.js
npm run start:prod     # run built dist/main.js
```

Validation and checks:
```bash
npm run prisma:validate
npm run prisma:generate
npm run build
npm run lint
npm run test:e2e
npm run docs:generate
```

Prisma migrations:
```bash
npm run prisma:migrate # local dev migration
npm run prisma:deploy  # apply committed migrations
```

Formatting:
```bash
npm run format
```

Useful GraphQL status check:
```bash
curl -X POST http://localhost:3000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ apiStatus }"}'
```

Darwin/macOS shell utilities available in this repo workflow:
- Prefer `rg` and `rg --files` for search.
- Use `sed -n 'start,endp' file` for short file reads.
- Use `npm run ...` scripts for validation instead of direct tool binaries when available.
- Use `git status --short` only if repo is initialized; this project may not always be inside a git repo.