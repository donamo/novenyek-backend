import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/test-app';

describe('GraphQL status query', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
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
});
