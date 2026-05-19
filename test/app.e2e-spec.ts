import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { ReadOnlyPrismaService } from '../src/prisma/read-only-prisma.service';

describe('GraphQL status query', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    ({ app, moduleRef } = await createTestApp());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /graphql returns API status without authentication', async () => {
    const server = app.getHttpServer() as App;
    const response = await request(server)
      .post('/graphql')
      .send({ query: '{ apiStatus }' })
      .expect(200);

    expect(response.body).toMatchObject({
      data: { apiStatus: 'ok' },
    });
  });

  it('GET /health checks both database connections and caches the result for 3 seconds', async () => {
    const server = app.getHttpServer() as App;
    const primaryPrisma = moduleRef.get(PrismaService);
    const readOnlyPrisma = moduleRef.get(ReadOnlyPrismaService);
    const primaryQuery = jest
      .spyOn(primaryPrisma, '$queryRaw')
      .mockResolvedValue([{ value: 1 }]);
    const readOnlyQuery = jest
      .spyOn(readOnlyPrisma, '$queryRaw')
      .mockResolvedValue([{ value: 1 }]);

    const firstResponse = await request(server).get('/health').expect(200);
    const secondResponse = await request(server).get('/health').expect(200);

    expect(firstResponse.body).toMatchObject({
      status: 'ok',
      checks: {
        database: 'ok',
        readOnlyDatabase: 'ok',
      },
    });
    expect(secondResponse.body).toEqual(firstResponse.body);
    expect(firstResponse.headers['cache-control']).toBe('public, max-age=3');
    expect(primaryQuery).toHaveBeenCalledTimes(1);
    expect(readOnlyQuery).toHaveBeenCalledTimes(1);
  });
});
