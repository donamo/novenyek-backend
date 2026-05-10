import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp, TEST_USER_ID } from './helpers/test-app';
import { asUser, asAnon } from './helpers/gql';
import { cleanupUser, seedTestUser, prisma } from './helpers/db';
import { TEST_USER } from './helpers/test-app';

const CREATE_ROOM = `
  mutation CreateRoom($input: CreateRoomDto!) {
    createRoom(input: $input) {
      id name orientation lightLevel humidityLevel averageTemperature notes
    }
  }
`;

const UPDATE_ROOM = `
  mutation UpdateRoom($id: ID!, $input: UpdateRoomDto!) {
    updateRoom(id: $id, input: $input) {
      id name notes
    }
  }
`;

const DELETE_ROOM = `
  mutation DeleteRoom($id: ID!) {
    deleteRoom(id: $id) { deleted }
  }
`;

const ROOMS = `query { rooms { id name } }`;

const ROOM = `
  query Room($id: ID!) {
    room(id: $id) { id name orientation lightLevel }
  }
`;

describe('Rooms (e2e)', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    server = app.getHttpServer() as App;
    await seedTestUser(TEST_USER_ID, TEST_USER.email, true, TEST_USER.displayName ?? undefined);
  });

  afterAll(async () => {
    await cleanupUser(TEST_USER_ID);
    await prisma.$disconnect();
    await app.close();
  });

  it('rejects anonymous access', async () => {
    const res = await asAnon(server).gql(ROOMS);
    expect(res.body.errors[0].extensions?.code).toBe('UNAUTHENTICATED');
  });

  describe('CRUD', () => {
    let roomId: string;

    it('creates a room with all fields', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_ROOM, {
        input: {
          name: 'Nappali',
          orientation: 'north',
          lightLevel: 'medium',
          humidityLevel: 'normal',
          averageTemperature: '21-24 °C',
          notes: 'Nagy ablak, közvetlen napfény nélkül.',
        },
      });
      expect(res.body.errors).toBeUndefined();
      const room = res.body.data.createRoom;
      expect(room.name).toBe('Nappali');
      expect(room.orientation).toBe('north');
      expect(room.lightLevel).toBe('medium');
      roomId = room.id as string;
    });

    it('creates a room with only required fields', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_ROOM, {
        input: { name: 'Konyha' },
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createRoom.name).toBe('Konyha');
    });

    it('lists rooms for the user', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(ROOMS);
      expect(res.body.errors).toBeUndefined();
      const names = (res.body.data.rooms as { name: string }[]).map((r) => r.name);
      expect(names).toContain('Nappali');
      expect(names).toContain('Konyha');
    });

    it('fetches a single room by id', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(ROOM, { id: roomId });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.room.id).toBe(roomId);
      expect(res.body.data.room.orientation).toBe('north');
    });

    it('updates a room', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(UPDATE_ROOM, {
        id: roomId,
        input: { notes: 'Frissített megjegyzés.' },
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateRoom.notes).toBe('Frissített megjegyzés.');
    });

    it('rejects invalid input (name too long)', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_ROOM, {
        input: { name: 'x'.repeat(121) },
      });
      expect(res.body.errors).toBeDefined();
    });

    it('deletes a room', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(DELETE_ROOM, { id: roomId });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.deleteRoom.deleted).toBe(true);
    });

    it('returns error when fetching deleted room', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(ROOM, { id: roomId });
      expect(res.body.errors).toBeDefined();
    });
  });
});
