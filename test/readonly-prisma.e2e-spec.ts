import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { ReadOnlyPrismaService } from '../src/prisma/read-only-prisma.service';
import { asUser } from './helpers/gql';
import { cleanupUser, prisma, seedTestUser } from './helpers/db';
import { createTestApp, TEST_USER, TEST_USER_ID } from './helpers/test-app';

const ROOMS = `query { rooms { id name } }`;

const CREATE_ROOM = `
  mutation CreateRoom($input: CreateRoomDto!) {
    createRoom(input: $input) {
      id
      name
    }
  }
`;

describe('Read-only Prisma routing (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let server: App;

  beforeAll(async () => {
    ({ app, moduleRef } = await createTestApp());
    server = app.getHttpServer() as App;
    await cleanupUser(TEST_USER_ID);
    await seedTestUser(
      TEST_USER_ID,
      TEST_USER.email,
      true,
      TEST_USER.displayName ?? undefined,
    );
    await prisma.room.create({
      data: {
        ownerUserId: TEST_USER_ID,
        name: 'Read-only query room',
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await cleanupUser(TEST_USER_ID);
    await prisma.$disconnect();
    await app.close();
  });

  it('serves independent read queries through the read-only Prisma client', async () => {
    const primaryPrisma = moduleRef.get(PrismaService);
    const readOnlyPrisma = moduleRef.get(ReadOnlyPrismaService);
    const primaryFindMany = jest.spyOn(primaryPrisma.room, 'findMany');
    const readOnlyFindMany = jest.spyOn(readOnlyPrisma.room, 'findMany');

    const res = await asUser(server, TEST_USER_ID).gql(ROOMS);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.rooms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Read-only query room' }),
      ]),
    );
    expect(readOnlyFindMany).toHaveBeenCalledTimes(1);
    expect(primaryFindMany).not.toHaveBeenCalled();
  });

  it('keeps mutations on the primary Prisma client', async () => {
    const primaryPrisma = moduleRef.get(PrismaService);
    const readOnlyPrisma = moduleRef.get(ReadOnlyPrismaService);
    const primaryCreate = jest.spyOn(primaryPrisma.room, 'create');
    const readOnlyCreate = jest.spyOn(readOnlyPrisma.room, 'create');

    const res = await asUser(server, TEST_USER_ID).gql(CREATE_ROOM, {
      input: { name: 'Primary mutation room' },
    });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.createRoom.name).toBe('Primary mutation room');
    expect(primaryCreate).toHaveBeenCalledTimes(1);
    expect(readOnlyCreate).not.toHaveBeenCalled();
  });
});
