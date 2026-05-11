import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import passport from 'passport';
import { Request, Response } from 'express';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaExceptionFilter } from '../../src/common/filters/prisma-exception.filter';
import { parseBodyParserLimit } from '../../src/common/http/body-parser-limit';
import { AuthenticatedUser } from '../../src/auth/auth.types';
import { User } from '@prisma/client';
import { createSessionMiddleware } from '../../src/auth/session.middleware';
import {
  createNotFoundDelayMiddleware,
  parseNotFoundDelayMs,
} from '../../src/common/middleware/not-found-delay.middleware';

export const TEST_USER_ID = 'e2e-test-user-aaaaaaaaa';
export const TEST_ADMIN_ID = 'e2e-test-admin-bbbbbbbbb';
export const DISABLED_USER_ID = 'e2e-disabled-user-ccccc';

export const TEST_USER: AuthenticatedUser = {
  id: TEST_USER_ID,
  email: 'test@example.com',
  displayName: 'Test User',
  isEnabled: true,
  isAdmin: false,
};

export const TEST_ADMIN: AuthenticatedUser = {
  id: TEST_ADMIN_ID,
  email: 'admin@example.com',
  displayName: 'Test Admin',
  isEnabled: true,  // admin is always enabled (AuthService.toAuthenticatedUser override)
  isAdmin: true,
};

export const DISABLED_USER: AuthenticatedUser = {
  id: DISABLED_USER_ID,
  email: 'disabled@example.com',
  displayName: 'Disabled User',
  isEnabled: false,
  isAdmin: false,
};

const USER_MAP: Record<string, AuthenticatedUser> = {
  [TEST_USER_ID]: TEST_USER,
  [TEST_ADMIN_ID]: TEST_ADMIN,
  [DISABLED_USER_ID]: DISABLED_USER,
};

function buildMockAuthService() {
  return {
    findUserById: jest.fn((id: string) => Promise.resolve(USER_MAP[id] ?? null)),
    isAdminEmail: jest.fn((email: string) => email === TEST_ADMIN.email),
    // UsersService calls toAuthenticatedUser(dbUser) — must return a real AuthenticatedUser
    toAuthenticatedUser: jest.fn((user: User): AuthenticatedUser => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isEnabled: user.isEnabled,
      isAdmin: user.email === TEST_ADMIN.email,
    })),
    findOrCreateGoogleUser: jest.fn(),
  };
}

export async function createTestApp(): Promise<{
  app: INestApplication;
  moduleRef: TestingModule;
}> {
  const mockAuthService = buildMockAuthService();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AuthService)
    .useValue(mockAuthService)
    .compile();

  const app = moduleRef.createNestApplication({ bodyParser: false });
  const config = app.get(ConfigService);
  const bodyParserLimit = parseBodyParserLimit(
    config.get<string>('BODY_PARSER_LIMIT'),
  );

  app.use(json({ limit: bodyParserLimit }));
  app.use(urlencoded({ extended: true, limit: bodyParserLimit }));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    createNotFoundDelayMiddleware(
      parseNotFoundDelayMs(config.get<string>('NOT_FOUND_DELAY_MS')),
    ),
  );
  // Use the real session middleware (same settings as production) so that
  // auth-session tests can verify Set-Cookie behaviour accurately.
  app.use(createSessionMiddleware(config));
  app.use(passport.initialize());
  app.use(passport.session());

  // Test-only login endpoint: must be registered BEFORE app.init() so that
  // NestJS's router does not intercept it first. Simulates the post-Google-OAuth
  // state by calling req.logIn() directly, establishing a real Passport session.
  app.use('/auth/test-login', (req: Request, res: Response) => {
    const userId = req.header('x-test-user-id');
    const user = userId ? USER_MAP[userId] : undefined;
    if (!user) {
      res.status(400).json({ error: 'Missing x-test-user-id header' });
      return;
    }
    req.logIn(user, (err?: Error) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ ok: true, sessionId: req.sessionID });
    });
  });

  // Test auth middleware: reads x-test-user-id header and injects the FULL user object,
  // bypassing the real Passport session flow. Runs after passport so it overrides.
  // Full user is needed because AuthenticatedGuard (used by /auth/me and me query)
  // returns request.user directly without calling authService.findUserById.
  app.use((req: Record<string, unknown>, _res: unknown, next: () => void) => {
    const userId = (req['headers'] as Record<string, string>)['x-test-user-id'];
    if (userId && typeof userId === 'string' && USER_MAP[userId]) {
      req['user'] = USER_MAP[userId];
      req['isAuthenticated'] = () => true;
    } else if (!req['isAuthenticated']) {
      req['isAuthenticated'] = () => false;
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  await app.init();

  return { app, moduleRef };
}
