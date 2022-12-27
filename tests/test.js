import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import server from '../server';
import JWTMiddleware from '../src/middleware/jwt';
import HijackMiddleware from './middleware/hijack';
import ContentMiddleware from './middleware/content';
import DelayMiddleware from './middleware/delay';
import API, { getController } from '..';

const USER = {
  firstName: 'John',
  lastName: 'James',
  password: '12345',
  userStatus: 1,
  phone: '12345',
  id: 10,
  email: 'john@email.com',
  username: 'theUser'
};

let schema;

beforeAll(async () => {
  const apiServer = await server();
  schema = await (await fetch('http://localhost:8080/api-docs')).json();

  return () => {
    apiServer.close();
  };
});

describe('SCHEMA', async () => {
  test('get schema', async () => {
    expect.assertions(1);

    const api = await new API(schema);

    expect(api).toBeDefined();
  });
});

describe('API', async () => {
  test('POST no data', async () => {
    const api = await new API(schema);

    expect.assertions(1);

    try {
      const user = await api.epoint('createUser', {
      });
    } catch (error) {
      expect(error.ok).toBeFalsy();
    }
  });

  test('POST succes', async () => {
    const api = await new API(schema);

    expect.assertions(1);

    const user = await api.epoint('createUser', {
      requestBody: {
        'firstName': 'John',
        'lastName': 'James',
        'password': '12345',
        'userStatus': 1,
        'phone': '12345',
        'id': 10,
        'email': 'john@email.com',
        'username': 'theUser3'
      },
    });

    expect(user).toStrictEqual(USER);
  });

  test('GET no data', async () => {
    const api = await new API(schema);

    expect.assertions(1);

    try {
      const user = await api.epoint('getUserByName', {
      });
    } catch (error) {
      expect(error.ok).toBeFalsy();
    }
  });

  test('GET success', async () => {
    const api = await new API(schema);

    expect.assertions(1);

    const user = await api.epoint('getUserByName', {
      parameters: {
        username: 'theUser',
      },
    });

    expect(user).toStrictEqual(USER);
  });

  test('fail to find enpoint', async () => {
    const api = await new API(schema);

    try {
      await api.epoint('nonExistentEndpoint');
    } catch (e) {
      expect(e.name === 'OperationNotFoundError').toBeTruthy();
    }
  });
});

describe('API CONFIG', async () => {
  test('"returnResponse": false, get result directly', async () => {
    const api = await new API(schema, {
      returnResponse: false,
    });

    expect.assertions(1);

    const user = await api.epoint('getUserByName', {
      parameters: {
        username: 'theUser',
      },
    });

    expect(user).toStrictEqual(USER);
  });

  test('"returnResponse": true, get response', async () => {
    const api = await new API(schema, {
      returnResponse: true,
    });

    expect.assertions(1);

    const user = await api.epoint('getUserByName', {
      parameters: {
        username: 'theUser',
      },
    });

    expect(user.obj).toStrictEqual(USER);
  });

  class FailAPI extends API {
    shouldFail(context) {
      return Boolean(context.options.fail);
    }

    fetchFunction = (url, requestOptions, context) => {
      if (this.shouldFail(context)) {
        return Promise.resolve(new Response(JSON.stringify({}), {
          status: 400,
          statusText: 'ko',
          headers: {
            'Content-Type': 'application/json',
          },
        }));
      }

      return fetch(url, requestOptions, context);
    };
  }

  test('"errorOnFail": true, get error', async () => {

    const api = await new FailAPI(schema, {
      fail: true,
      errorOnFail: true,
    });

    expect.assertions(1);

    try {
      const user = await api.epoint('getUserByName', {
        fail: true,
        parameters: {
          username: 'theUser',
        },
      });
    } catch (error) {
      expect(error instanceof Error).toBeTruthy();
    }
  });

  test('"errorOnFail": false, get response', async () => {
    const api = await new FailAPI(schema, {
      fail: true,
      errorOnFail: false,
    });

    expect.assertions(1);

    try {
      const user = await api.epoint('getUserByName', {
        fail: true,
        parameters: {
          username: 'theUser',
        },
      });
    } catch (error) {
      expect(error.status).toBe(400);
    }
  });
});

describe('MIDDLEWARE', async () => {
  test('hijack call', async () => {
    class HijackAPI extends API {
      get middlewares() {
        return [
          HijackMiddleware,
        ];
      }
    }

    const api = await new HijackAPI(schema, {
      hijack: true,
    });

    expect.assertions(1);

    const user = await api.epoint('getUserByName', {
      hijack: true,
      parameters: {
        username: 'theUser',
      },
    });

    expect(user).toStrictEqual({
      hijacked: true,
    });
  });

  test('JWT request', async () => {
    expect.assertions(2);

    const token = 'mytoken';

    class JWTAPI extends API {
      get middlewares() {
        return [
          JWTMiddleware,
        ];
      }

      fetch(url, options, ref, context) {
        expect(options.headers.Authorization).toEqual(`Bearer ${token}`);
        return super.fetch(url, options, ref, context);
      }
    }

    const api = await new JWTAPI(schema, {
      jwt: {
        token,
      },
    });

    const user = await api.epoint('getUserByName', {
      parameters: {
        username: 'theUser',
      },
    });

    expect(user).toStrictEqual(USER);
  });

  test('modify content response', async () => {
    class ContentAPI extends API {
      get middlewares() {
        return [
          ContentMiddleware,
        ];
      }
    }

    const api = await new ContentAPI(schema, {
      content: true,
    });

    expect.assertions(1);

    const user = await api.epoint('getUserByName', {
      content: true,
      parameters: {
        username: 'theUser',
      },
    });

    expect(user.content).toBeTruthy();
  });
});

describe('CANCEL', async () => {
  class DelayAPI extends API {
    get middlewares() {
      return [
        DelayMiddleware,
      ];
    }
  }

  test('cancel with controller call', async () => {
    const api = await new DelayAPI(schema, {
      delay: true,
    });

    expect.assertions(2);

    const controller = getController({
      id: 'getUserByName',
      name: 'getUserByName',
    });

    await new Promise((resolve) => {
      api.epoint(controller, {
        delay: 300,
        parameters: {
          username: 'theUser',
        },
      })
        .catch((error) => {
          expect(error instanceof Error).toBe(true);
          expect(error.message.includes('canceled')).toBe(true);
          resolve();
        });
      api.cancel(controller);
    });
  });

  test('auto cancelation', async () => {
    expect.assertions(3);

    const api = await new DelayAPI(schema, {
      delay: true,
    });

    const controllerData = {
      id: 'getUserByName',
      name: 'getUserByName',
      clean: true,
    };

    await new Promise((resolve) => {
      api.epoint(getController(controllerData), {
        delay: 300,
        parameters: {
          username: 'theUser',
        },
      })
        .catch((error) => {
          expect(error instanceof Error).toBe(true);
          expect(error.message.includes('canceled')).toBe(true);
        });

      api.epoint(getController(controllerData), {
        delay: 300,
        parameters: {
          username: 'theUser',
        },
      })
        .then((user) => {
          expect(user).toStrictEqual(USER);
          resolve();
        });
    });
  });

  test('no cancelation', async () => {
    expect.assertions(2);

    const api = await new DelayAPI(schema, {
      delay: true,
    });

    const controllerData = {
      id: 'getUserByName',
      name: 'getUserByName',
      clean: false,
    };

    await new Promise((resolve) => {
      api.epoint(getController(controllerData), {
        delay: 300,
        parameters: {
          username: 'theUser',
        },

      })
        .then((user) => {
          expect(user).toStrictEqual(USER);
        });

      api.epoint(getController(controllerData), {
        delay: 300,
        parameters: {
          username: 'theUser',
        },
      })
        .then((user) => {
          expect(user).toStrictEqual(USER);
          resolve();
        });
    });
  });

  test('avoid cancelation with mix requests', async () => {
    expect.assertions(2);

    const api = await new DelayAPI(schema, {
      delay: true,
    });

    const controllerData = {
      id: 'getUserByName',
      name: 'getUserByName',
      clean: true,
    };

    await new Promise((resolve) => {
      api.epoint('getUserByName', {
        delay: 300,
        parameters: {
          username: 'theUser',
        },

      })
        .then((user) => {
          expect(user).toStrictEqual(USER);
        });

      api.epoint(getController(controllerData), {
        delay: 300,
        parameters: {
          username: 'theUser',
        },
      })
        .then((user) => {
          expect(user).toStrictEqual(USER);
          resolve();
        });
    });
  });
});
