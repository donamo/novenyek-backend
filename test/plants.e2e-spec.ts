import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp, TEST_USER_ID } from './helpers/test-app';
import { asUser, asAnon } from './helpers/gql';
import { cleanupUser, seedTestUser, prisma } from './helpers/db';
import { TEST_USER } from './helpers/test-app';

const CREATE_PLANT = `
  mutation CreatePlant($input: CreatePlantDto!) {
    createPlant(input: $input) {
      id name nickname species category size potSizeCm status notes
    }
  }
`;

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

    it('creates a plant with all fields', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_PLANT, {
        input: {
          name: 'Zelkova bonsai',
          nickname: 'Bonsai',
          species: 'Zelkova serrata',
          category: 'bonsai',
          size: 'small',
          potSizeCm: 14,
          status: 'active',
          notes: 'Első bonsai növény.',
        },
      });
      expect(res.body.errors).toBeUndefined();
      const plant = res.body.data.createPlant;
      expect(plant.name).toBe('Zelkova bonsai');
      expect(plant.species).toBe('Zelkova serrata');
      expect(plant.size).toBe('small');
      expect(plant.potSizeCm).toBe(14);
      plantId = plant.id as string;
    });

    it('creates a plant with only required fields', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_PLANT, {
        input: { name: 'Minimál növény' },
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createPlant.name).toBe('Minimál növény');
      expect(res.body.data.createPlant.status).toBe('active');
    });

    it('lists plants for the user', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(PLANTS);
      expect(res.body.errors).toBeUndefined();
      const names = (res.body.data.plants as { name: string }[]).map((p) => p.name);
      expect(names).toContain('Zelkova bonsai');
    });

    it('fetches a single plant by id', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(PLANT, { id: plantId });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.plant.id).toBe(plantId);
      expect(res.body.data.plant.species).toBe('Zelkova serrata');
    });

    it('updates a plant', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(UPDATE_PLANT, {
        id: plantId,
        input: { status: 'inactive', notes: 'Átmenetileg nem aktív.' },
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updatePlant.status).toBe('inactive');
    });

    it('rejects invalid potSizeCm (out of range)', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_PLANT, {
        input: { name: 'Bad plant', potSizeCm: 999 },
      });
      expect(res.body.errors).toBeDefined();
    });

    it('rejects unknown extra fields', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_PLANT, {
        input: { name: 'Bad plant', unknownField: 'value' },
      });
      expect(res.body.errors).toBeDefined();
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
