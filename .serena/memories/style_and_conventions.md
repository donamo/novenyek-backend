# Style and Conventions

General:
- TypeScript strict mode is enabled.
- NestJS module-per-domain structure.
- Domain API is GraphQL-first; avoid adding REST controllers except for auth infrastructure.
- REST currently remains only for `AuthController`; `apiStatus` is GraphQL, not REST health.
- PrismaService is global via `PrismaModule`.
- Keep auth/session/security helpers out of domain services.

GraphQL patterns:
- Domain modules expose `*.resolver.ts` rather than controllers.
- DTOs used as GraphQL inputs are decorated with `@InputType()` and `@Field()`.
- Output models live under `models/` and use `@ObjectType()`/`@Field()`.
- Register Prisma enums for GraphQL in `src/common/graphql/register-enums.ts`.
- Naming: plural query for lists (`plants`, `rooms`), singular query for one record (`plant`, `room`), imperative mutation names (`createPlant`, `updateRoom`, etc.).

Auth/ownership:
- Use `@UseGuards(EnabledUserGuard)` for domain GraphQL resolvers.
- Use `@CurrentUser()` to get `AuthenticatedUser` and pass `user.id` to services.
- Every owner-scoped service method should filter/check by `ownerUserId`.
- Admin GraphQL operations use `AdminGuard`.

Prisma/domain rules:
- User-owned entities include `ownerUserId`.
- Check parent ownership in services, especially child resources under plants.
- Keep migrations committed under `prisma/migrations` for schema changes.

Lint/format:
- ESLint covers `src`, `test`, and `scripts`.
- Prettier config uses single quotes and trailing commas.
- Avoid unsafe `any`; use small typed aliases where framework adapters return any.
- Logging uses Nest `Logger`; configure runtime verbosity with `LOG_LEVEL=error|warn|log|debug|verbose|silent`. Do not log secrets, tokens, raw image/base64 payloads, or full request bodies.
- Prefer focused comments only where needed.