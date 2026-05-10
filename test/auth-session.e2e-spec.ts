import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  createTestApp,
  TEST_USER_ID,
  TEST_ADMIN_ID,
  DISABLED_USER_ID,
  TEST_USER,
  TEST_ADMIN,
  DISABLED_USER,
} from './helpers/test-app';
import { cleanupUser, seedTestUser, prisma } from './helpers/db';

// Regression tests for the Google OAuth session cookie flow.
//
// The specific bug this covers: NestJS AuthGuard defaults to session:false,
// so req.logIn() was never called in googleCallback. The session was saved
// empty (no passport data), Set-Cookie was not sent, and every subsequent
// request returned 401.
//
// /auth/test-login is a test-only endpoint (added in createTestApp) that
// calls req.logIn() directly, simulating the post-OAuth state without needing
// real Google credentials.

describe('Auth session cookie flow (e2e)', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    server = app.getHttpServer() as App;
    await seedTestUser(TEST_USER_ID, TEST_USER.email, true, TEST_USER.displayName ?? undefined);
    // Admin is seeded with isEnabled=false to verify the override logic
    await seedTestUser(TEST_ADMIN_ID, TEST_ADMIN.email, false, TEST_ADMIN.displayName ?? undefined);
    await seedTestUser(
      DISABLED_USER_ID,
      DISABLED_USER.email,
      false,
      DISABLED_USER.displayName ?? undefined,
    );
  });

  afterAll(async () => {
    await cleanupUser(TEST_USER_ID);
    await cleanupUser(TEST_ADMIN_ID);
    await cleanupUser(DISABLED_USER_ID);
    await prisma.$disconnect();
    await app.close();
  });

  describe('Session establishment via req.logIn()', () => {
    it('Set-Cookie is present on login response', async () => {
      const res = await request(server)
        .get('/auth/test-login')
        .set('x-test-user-id', TEST_USER_ID)
        .expect(200);

      const setCookie = res.headers['set-cookie'] as string[] | string | undefined;
      expect(setCookie).toBeDefined();

      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie as string];
      const sessionCookie = cookies.find((c) => c.startsWith('connect.sid='));
      expect(sessionCookie).toBeDefined();
    });

    it('Set-Cookie contains HttpOnly and SameSite=Lax', async () => {
      const res = await request(server)
        .get('/auth/test-login')
        .set('x-test-user-id', TEST_USER_ID)
        .expect(200);

      const setCookie = res.headers['set-cookie'] as string[] | string;
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const sessionCookie = cookies.find((c) => c.startsWith('connect.sid='))!;

      expect(sessionCookie.toLowerCase()).toContain('httponly');
      expect(sessionCookie.toLowerCase()).toContain('samesite=lax');
    });
  });

  describe('/auth/me with session cookie', () => {
    let sessionCookie: string;

    beforeEach(async () => {
      const res = await request(server)
        .get('/auth/test-login')
        .set('x-test-user-id', TEST_USER_ID);

      const setCookie = res.headers['set-cookie'] as string[] | string;
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      sessionCookie = cookies.find((c) => c.startsWith('connect.sid='))!;
    });

    it('returns 200 with user data when cookie is valid', async () => {
      const res = await request(server)
        .get('/auth/me')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(res.body).toMatchObject({
        id: TEST_USER_ID,
        email: TEST_USER.email,
        isEnabled: true,
        isAdmin: false,
      });
    });

    it('returns 401 without cookie', async () => {
      await request(server).get('/auth/me').expect(401);
    });

    it('returns 401 with an invalid/tampered cookie', async () => {
      await request(server)
        .get('/auth/me')
        .set('Cookie', 'connect.sid=s%3Ainvalid.tampered')
        .expect(401);
    });
  });

  describe('Admin is always enabled', () => {
    it('admin isEnabled is true even if DB has isEnabled=false', async () => {
      const loginRes = await request(server)
        .get('/auth/test-login')
        .set('x-test-user-id', TEST_ADMIN_ID);

      const setCookie = loginRes.headers['set-cookie'] as string[] | string;
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const cookie = cookies.find((c) => c.startsWith('connect.sid='))!;

      const res = await request(server).get('/auth/me').set('Cookie', cookie).expect(200);
      expect(res.body.isAdmin).toBe(true);
      expect(res.body.isEnabled).toBe(true);
    });

    it('admin can access GraphQL domain queries (EnabledUserGuard)', async () => {
      const loginRes = await request(server)
        .get('/auth/test-login')
        .set('x-test-user-id', TEST_ADMIN_ID);

      const setCookie = loginRes.headers['set-cookie'] as string[] | string;
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const cookie = cookies.find((c) => c.startsWith('connect.sid='))!;

      const res = await request(server)
        .post('/graphql')
        .set('Cookie', cookie)
        .send({ query: '{ rooms { id } }' });

      expect(res.body.errors).toBeUndefined();
    });
  });

  describe('Disabled user session', () => {
    it('disabled user can access /auth/me (AuthenticatedGuard, not EnabledUserGuard)', async () => {
      const loginRes = await request(server)
        .get('/auth/test-login')
        .set('x-test-user-id', DISABLED_USER_ID);

      const setCookie = loginRes.headers['set-cookie'] as string[] | string;
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const cookie = cookies.find((c) => c.startsWith('connect.sid='))!;

      // /auth/me uses AuthenticatedGuard (only checks isAuthenticated()),
      // so disabled users can still read their own profile.
      const res = await request(server).get('/auth/me').set('Cookie', cookie).expect(200);
      expect(res.body.isEnabled).toBe(false);
    });

    it('disabled user is blocked from GraphQL domain queries (EnabledUserGuard)', async () => {
      const loginRes = await request(server)
        .get('/auth/test-login')
        .set('x-test-user-id', DISABLED_USER_ID);

      const setCookie = loginRes.headers['set-cookie'] as string[] | string;
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const cookie = cookies.find((c) => c.startsWith('connect.sid='))!;

      const res = await request(server)
        .post('/graphql')
        .set('Cookie', cookie)
        .send({ query: '{ rooms { id } }' });

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].extensions?.code).toBe('FORBIDDEN');
    });
  });

  describe('Logout', () => {
    it('clears the session and subsequent /auth/me returns 401', async () => {
      const loginRes = await request(server)
        .get('/auth/test-login')
        .set('x-test-user-id', TEST_USER_ID);

      const setCookie = loginRes.headers['set-cookie'] as string[] | string;
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const cookie = cookies.find((c) => c.startsWith('connect.sid='))!;

      // confirm logged in
      await request(server).get('/auth/me').set('Cookie', cookie).expect(200);

      // logout
      await request(server).post('/auth/logout').set('Cookie', cookie);

      // session should be gone
      await request(server).get('/auth/me').set('Cookie', cookie).expect(401);
    });
  });
});
