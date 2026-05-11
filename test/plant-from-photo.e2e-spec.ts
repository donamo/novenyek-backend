import { INestApplication } from '@nestjs/common';
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

const ONE_PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1W4uQAAAAASUVORK5CYII=';

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
        imageBase64: `data:image/png;base64,${ONE_PIXEL_PNG_BASE64}`,
        originalFilename: 'plant.png',
      },
    });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.createPlantFromPhoto.name).toBe('Szobafikusz');
    expect(res.body.data.createPlantFromPhoto.species).toBe('Ficus elastica');
    expect(res.body.data.createPlantFromPhoto.category).toBe('szobanoveny');
    expect(res.body.data.createPlantFromPhoto.size).toBe('medium');
    expect(res.body.data.createPlantFromPhoto._count.photos).toBe(1);
    expect(res.body.data.createPlantFromPhoto.notes).toContain(
      'Mock AI növényfelismerés',
    );
  });
});
