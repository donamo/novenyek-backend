import { INestApplication } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, TEST_USER, TEST_USER_ID } from './helpers/test-app';
import { asUser } from './helpers/gql';
import { cleanupUser, prisma, seedTestUser } from './helpers/db';

const CREATE_PLANT_FROM_PHOTO = `
  mutation CreatePlantFromPhoto($input: CreatePlantFromPhotoInput!) {
    createPlantFromPhoto(input: $input) {
      id
      name
      species
      category
      size
      notes
      _count { photos }
    }
  }
`;

const TEST_IMAGE_BASE64 = readFileSync(
  resolve(process.cwd(), 'test/misc/plants.jpeg'),
).toString('base64');

describe('CreatePlantFromPhoto (e2e)', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    server = app.getHttpServer() as App;
    await seedTestUser(
      TEST_USER_ID,
      TEST_USER.email,
      true,
      TEST_USER.displayName ?? undefined,
    );
  });

  afterAll(async () => {
    await cleanupUser(TEST_USER_ID);
    await prisma.$disconnect();
    await app.close();
  });

  it('creates a plant and prefills AI-derived fields from the first photo', async () => {
    const res = await asUser(server, TEST_USER_ID).gql(CREATE_PLANT_FROM_PHOTO, {
      input: {
        imageBase64: `data:image/jpeg;base64,${TEST_IMAGE_BASE64}`,
        originalFilename: 'plants.jpeg',
      },
    });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.createPlantFromPhoto.id).toBeTruthy();
    expect(res.body.data.createPlantFromPhoto.name).toBeTruthy();
    expect(res.body.data.createPlantFromPhoto._count.photos).toBe(1);
    expect(
      typeof res.body.data.createPlantFromPhoto.species === 'string' ||
        typeof res.body.data.createPlantFromPhoto.category === 'string' ||
        typeof res.body.data.createPlantFromPhoto.size === 'string',
    ).toBe(true);

    const plant = await prisma.plant.findUniqueOrThrow({
      where: { id: res.body.data.createPlantFromPhoto.id as string },
      include: { requirement: true },
    });
    expect(plant.acquiredAt).toBeTruthy();
    expect(plant.requirement).toBeTruthy();
    expect(plant.potSizeCm).toBeTruthy();
    expect(
      plant.requirement?.lightNeed ||
        plant.requirement?.waterNeed ||
        plant.requirement?.soilNeed,
    ).toBeTruthy();
    expect(plant.name).toBe(plant.species);

    const photo = await prisma.plantPhoto.findFirstOrThrow({
      where: { plantId: plant.id, ownerUserId: TEST_USER_ID },
    });
    expect(photo.thumbnailPath).toBeTruthy();
    const thumbnailUrl = photo.thumbnailPath!.startsWith('./')
      ? `/${photo.thumbnailPath!.slice(2)}`
      : photo.thumbnailPath!.startsWith('/')
        ? photo.thumbnailPath!
        : `/${photo.thumbnailPath!}`;

    const thumbnailResponse = await request(server).get(thumbnailUrl);
    expect(thumbnailResponse.status).toBe(200);
    expect(thumbnailResponse.headers['cross-origin-resource-policy']).toBe(
      'cross-origin',
    );
  });
});
