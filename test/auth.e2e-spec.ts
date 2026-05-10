import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import {
  createTestApp,
  TEST_USER_ID,
  DISABLED_USER_ID,
  TEST_USER,
  DISABLED_USER,
} from './helpers/test-app';
import { asAnon, asUser, asUserRest } from './helpers/gql';
import { cleanupUser, seedTestUser, prisma } from './helpers/db';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    server = app.getHttpServer() as App;
    await seedTestUser(TEST_USER_ID, TEST_USER.email, true, TEST_USER.displayName ?? undefined);
    await seedTestUser(
      DISABLED_USER_ID,
      DISABLED_USER.email,
      false,
      DISABLED_USER.displayName ?? undefined,
    );
  });

  afterAll(async () => {
    await cleanupUser(TEST_USER_ID);
    await cleanupUser(DISABLED_USER_ID);
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /auth/me', () => {
    it('returns 401 when not authenticated', async () => {
      await asAnon(server).get('/auth/me').expect(401);
    });

    it('returns the current user when authenticated', async () => {
      const res = await asUserRest(server, TEST_USER_ID).get('/auth/me').expect(200);
      expect(res.body).toMatchObject({
        id: TEST_USER_ID,
        email: TEST_USER.email,
        isEnabled: true,
        isAdmin: false,
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 401 when not authenticated', async () => {
      await asAnon(server).post('/auth/logout').expect(401);
    });

    it('logs out an authenticated user', async () => {
      const res = await asUserRest(server, TEST_USER_ID).post('/auth/logout').expect(201);
      expect(res.body).toMatchObject({ loggedOut: true });
    });
  });

  describe('Anonymous GraphQL access', () => {
    it('rejects anonymous access to protected queries', async () => {
      const res = await asAnon(server).gql('{ rooms { id } }');
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].extensions?.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('Disabled user access', () => {
    it('blocks disabled user from domain GraphQL queries', async () => {
      const res = await asUser(server, DISABLED_USER_ID).gql('{ rooms { id } }');
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].extensions?.code).toBe('FORBIDDEN');
    });
  });
});
