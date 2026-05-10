import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp, TEST_USER_ID, TEST_ADMIN_ID, DISABLED_USER_ID } from './helpers/test-app';
import { asUser } from './helpers/gql';
import { cleanupUser, seedTestUser, prisma } from './helpers/db';
import { TEST_USER, TEST_ADMIN, DISABLED_USER } from './helpers/test-app';

const ME = `query { me { id email isEnabled isAdmin } }`;

const USERS = `query { users { id email isEnabled isAdmin } }`;

const UPDATE_USER_ENABLED = `
  mutation UpdateUserEnabled($input: UpdateUserEnabledInput!) {
    updateUserEnabled(input: $input) { id email isEnabled }
  }
`;

describe('Users (e2e)', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    server = app.getHttpServer() as App;

    await seedTestUser(TEST_USER_ID, TEST_USER.email, true, TEST_USER.displayName ?? undefined);
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

  describe('me query', () => {
    it('returns current user with isEnabled and isAdmin', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(ME);
      expect(res.body.errors).toBeUndefined();
      const user = res.body.data.me;
      expect(user.id).toBe(TEST_USER_ID);
      expect(user.isEnabled).toBe(true);
      expect(user.isAdmin).toBe(false);
    });

    it('returns isAdmin=true for admin user', async () => {
      const res = await asUser(server, TEST_ADMIN_ID).gql(ME);
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.me.isAdmin).toBe(true);
    });

    it('returns isEnabled=false for disabled user', async () => {
      const res = await asUser(server, DISABLED_USER_ID).gql(ME);
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.me.isEnabled).toBe(false);
    });
  });

  describe('users query (admin only)', () => {
    it('returns all users when called by admin', async () => {
      const res = await asUser(server, TEST_ADMIN_ID).gql(USERS);
      expect(res.body.errors).toBeUndefined();
      const ids = (res.body.data.users as { id: string }[]).map((u) => u.id);
      expect(ids).toContain(TEST_USER_ID);
      expect(ids).toContain(TEST_ADMIN_ID);
    });

    it('rejects non-admin access', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(USERS);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].extensions?.code).toBe('FORBIDDEN');
    });
  });

  describe('updateUserEnabled mutation (admin only)', () => {
    it('admin can disable a user', async () => {
      const res = await asUser(server, TEST_ADMIN_ID).gql(UPDATE_USER_ENABLED, {
        input: { id: TEST_USER_ID, isEnabled: false },
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateUserEnabled.isEnabled).toBe(false);
    });

    it('admin can re-enable a user', async () => {
      const res = await asUser(server, TEST_ADMIN_ID).gql(UPDATE_USER_ENABLED, {
        input: { id: TEST_USER_ID, isEnabled: true },
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateUserEnabled.isEnabled).toBe(true);
    });

    it('rejects non-admin access', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(UPDATE_USER_ENABLED, {
        input: { id: DISABLED_USER_ID, isEnabled: true },
      });
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].extensions?.code).toBe('FORBIDDEN');
    });
  });
});
