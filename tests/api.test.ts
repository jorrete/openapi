import {
  beforeAll,
  describe,
  expect,
  test,
} from 'vitest';

import { server } from '../server';
import { SwaggerAPI } from '../src/api';

const USER = {
  __server: true,
  email: 'john@email.com',
  firstName: 'John',
  id: 10,
  lastName: 'James',
  password: '12345',
  phone: '12345',
  userStatus: 1,
  username: 'theUser',
};

let spec: object;

beforeAll(async () => {
  const apiServer = await server();
  spec = await (await fetch('http://localhost:8080/api-docs')).json();

  return () => {
    apiServer.close();
  };
});

describe('SCHEMA', async () => {
  test('get schema', async () => {
    expect.assertions(1);

    const api = new SwaggerAPI({
      spec,
    });

    expect(api).toBeDefined();
  });
});

describe('API', async () => {
  test('POST no data', async () => {
    const api = new SwaggerAPI({
      spec,
    });

    expect.assertions(1);

    try {
      await api.execute({
        operationId: 'createUser',
      });
    } catch (error) {
      expect(error.response.ok).toBeFalsy();
    }
  });

  test('POST succes', async () => {
    const api = new SwaggerAPI({
      spec,
    });

    expect.assertions(1);

    const user = await api.execute({
      operationId: 'createUser',
      requestBody: {
        'email': 'john@email.com',
        'firstName': 'John',
        'id': 10,
        'lastName': 'James',
        'password': '12345',
        'phone': '12345',
        'userStatus': 1,
        'username': 'theUser3',
      },
    });
    expect(user.body).toStrictEqual(USER);
  });
});
