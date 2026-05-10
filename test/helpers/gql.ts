import request from 'supertest';
import { App } from 'supertest/types';

export function asUser(server: App, userId: string) {
  return {
    gql(query: string, variables?: Record<string, unknown>) {
      return request(server)
        .post('/graphql')
        .set('x-test-user-id', userId)
        .send({ query, variables });
    },
  };
}

export function asAnon(server: App) {
  return {
    gql(query: string, variables?: Record<string, unknown>) {
      return request(server).post('/graphql').send({ query, variables });
    },
    get(path: string) {
      return request(server).get(path);
    },
    post(path: string) {
      return request(server).post(path);
    },
  };
}

export function asUserRest(server: App, userId: string) {
  return {
    get(path: string) {
      return request(server).get(path).set('x-test-user-id', userId);
    },
    post(path: string) {
      return request(server).post(path).set('x-test-user-id', userId);
    },
  };
}
