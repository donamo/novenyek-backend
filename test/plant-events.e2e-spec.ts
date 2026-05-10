import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp, TEST_USER_ID } from './helpers/test-app';
import { asUser } from './helpers/gql';
import { cleanupUser, seedTestUser, prisma } from './helpers/db';
import { TEST_USER } from './helpers/test-app';

const CREATE_PLANT = `
  mutation CreatePlant($input: CreatePlantDto!) {
    createPlant(input: $input) { id }
  }
`;

const CREATE_EVENT = `
  mutation CreatePlantEvent($plantId: ID!, $input: CreatePlantEventDto!) {
    createPlantEvent(plantId: $plantId, input: $input) {
      id type eventDate title description
    }
  }
`;

const UPDATE_EVENT = `
  mutation UpdatePlantEvent($plantId: ID!, $eventId: ID!, $input: UpdatePlantEventDto!) {
    updatePlantEvent(plantId: $plantId, eventId: $eventId, input: $input) {
      id title description
    }
  }
`;

const DELETE_EVENT = `
  mutation DeletePlantEvent($plantId: ID!, $eventId: ID!) {
    deletePlantEvent(plantId: $plantId, eventId: $eventId) { deleted }
  }
`;

const PLANT_EVENTS = `
  query PlantEvents($plantId: ID!) {
    plantEvents(plantId: $plantId) { id type title eventDate }
  }
`;

describe('Plant Events (e2e)', () => {
  let app: INestApplication;
  let server: App;
  let plantId: string;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    server = app.getHttpServer() as App;
    await seedTestUser(TEST_USER_ID, TEST_USER.email, true, TEST_USER.displayName ?? undefined);

    const res = await asUser(server, TEST_USER_ID).gql(CREATE_PLANT, {
      input: { name: 'Esemény teszt növény' },
    });
    plantId = res.body.data.createPlant.id as string;
  });

  afterAll(async () => {
    await cleanupUser(TEST_USER_ID);
    await prisma.$disconnect();
    await app.close();
  });

  describe('CRUD', () => {
    let eventId: string;

    it('creates an event with all fields', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_EVENT, {
        plantId,
        input: {
          type: 'repotting',
          eventDate: '2026-05-09',
          title: 'Átültetés',
          description: 'Átültetve 14 cm-es cserépbe.',
        },
      });
      expect(res.body.errors).toBeUndefined();
      const event = res.body.data.createPlantEvent;
      expect(event.type).toBe('repotting');
      expect(event.title).toBe('Átültetés');
      eventId = event.id as string;
    });

    it('creates an event with only required fields', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_EVENT, {
        plantId,
        input: {
          type: 'watering',
          eventDate: '2026-05-10',
          title: 'Öntözés',
        },
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createPlantEvent.description).toBeNull();
    });

    it('lists events for a plant', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(PLANT_EVENTS, { plantId });
      expect(res.body.errors).toBeUndefined();
      const types = (res.body.data.plantEvents as { type: string }[]).map((e) => e.type);
      expect(types).toContain('repotting');
      expect(types).toContain('watering');
    });

    it('updates an event', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(UPDATE_EVENT, {
        plantId,
        eventId,
        input: { description: 'Friss bonsai földkeverékbe.' },
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updatePlantEvent.description).toBe('Friss bonsai földkeverékbe.');
    });

    it('rejects event creation with invalid type', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_EVENT, {
        plantId,
        input: {
          type: 'invalid_type',
          eventDate: '2026-05-10',
          title: 'Bad',
        },
      });
      expect(res.body.errors).toBeDefined();
    });

    it('rejects event creation with title too long', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_EVENT, {
        plantId,
        input: {
          type: 'note',
          eventDate: '2026-05-10',
          title: 'x'.repeat(181),
        },
      });
      expect(res.body.errors).toBeDefined();
    });

    it('deletes an event', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(DELETE_EVENT, { plantId, eventId });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.deletePlantEvent.deleted).toBe(true);
    });
  });

  describe('Owner scoping', () => {
    it('cannot access events of a plant owned by another user', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(PLANT_EVENTS, {
        plantId: 'non-existent-plant-id',
      });
      expect(res.body.errors).toBeDefined();
    });
  });
});
