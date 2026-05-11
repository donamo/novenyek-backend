import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp, TEST_USER_ID } from './helpers/test-app';
import { asUser, asAnon } from './helpers/gql';
import { cleanupUser, createPlantForTest, seedTestUser, prisma } from './helpers/db';
import { TEST_USER } from './helpers/test-app';

const UPDATE_PLANT = `
  mutation UpdatePlant($id: ID!, $input: UpdatePlantDto!) {
    updatePlant(id: $id, input: $input) {
      id name status notes
    }
  }
`;

const DELETE_PLANT = `
  mutation DeletePlant($id: ID!) {
    deletePlant(id: $id) { deleted }
  }
`;

const PLANTS = `query { plants { id name status } }`;

const PLANT = `
  query Plant($id: ID!) {
    plant(id: $id) { id name species size potSizeCm }
  }
`;

describe('Plants (e2e)', () => {
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
    const res = await asAnon(server).gql(PLANTS);
    expect(res.body.errors[0].extensions?.code).toBe('UNAUTHENTICATED');
  });

  describe('CRUD', () => {
    let plantId: string;

    it('lists plants for the user', async () => {
      const plant = await createPlantForTest({
        ownerUserId: TEST_USER_ID,
        name: 'Zelkova bonsai',
        species: 'Zelkova serrata',
        category: 'bonsai',
        potSizeCm: 14,
      });
      plantId = plant.id;

      await createPlantForTest({
        ownerUserId: TEST_USER_ID,
        name: 'Minimal noveny',
      });

      const res = await asUser(server, TEST_USER_ID).gql(PLANTS);
      expect(res.body.errors).toBeUndefined();
      const names = (res.body.data.plants as { name: string }[]).map((p) => p.name);
      expect(names).toContain('Zelkova bonsai');
      expect(names).toContain('Minimal noveny');
    });

    it('fetches a single plant by id', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(PLANT, { id: plantId });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.plant.id).toBe(plantId);
      expect(res.body.data.plant.species).toBe('Zelkova serrata');
      expect(res.body.data.plant.potSizeCm).toBe(14);
    });

    it('updates a plant', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(UPDATE_PLANT, {
        id: plantId,
        input: { status: 'inactive', notes: 'Átmenetileg nem aktív.' },
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updatePlant.status).toBe('inactive');
    });

    it('deletes a plant', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(DELETE_PLANT, { id: plantId });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.deletePlant.deleted).toBe(true);
    });

    it('returns error when fetching deleted plant', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(PLANT, { id: plantId });
      expect(res.body.errors).toBeDefined();
    });
  });
});
