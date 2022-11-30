/* eslint-disable class-methods-use-this */
/* eslint max-classes-per-file: off */
import API, { getController } from '..';
import JWTMiddleware from '../middleware/jwt';
import HijackMiddleware from './hijack';
import ContentMiddleware from './content';
import DelayMiddleware from './delay';
import schema from './schema.test.json';

const testResponse = {
  test: true,
};

class BaseTestAPI extends API {
  checkFail() {
    return false;
  }

  fetch(url) {
    if (this.checkFail((url))) {
      return new Response(JSON.stringify(testResponse), {
        status: 400,
        statusText: 'ko',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify(testResponse), {
      status: 200,
      statusText: 'ok',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// We want to test we pass the schema
// and swaggers inits well
// Swagger it is already tested
describe('schema', () => {
  test('find enpoint', async () => {
    expect.assertions(1);

    class TestAPI extends BaseTestAPI {}
    const api = await new TestAPI(schema, {});
    const result = await api.epoint('getLandUse_list');
    expect(result).toEqual(testResponse);
  });

  test('fail to find enpoint', async () => {
    expect.assertions(1);

    try {
      class TestAPI extends BaseTestAPI {}
      const api = await new TestAPI(schema, {});
      await api.epoint('getLandUse_list_x');
    } catch (e) {
      expect(e.name === 'OperationNotFoundError').toBe(true);
    }
  });
});

// test that returnResponse modifies
// responses structure
describe('option returnResponse', () => {
  test('return only the content', async () => {
    expect.assertions(1);

    class TestAPI extends BaseTestAPI {}
    const api = await new TestAPI(schema, {
      returnResponse: false,
    });
    const result = await api.epoint('getLandUse_list');
    expect(result).toEqual(testResponse);
  });

  test('return the response object', async () => {
    expect.assertions(1);

    class TestAPI extends BaseTestAPI {}
    const api = await new TestAPI(schema, {
      returnResponse: true,
    });
    const result = await api.epoint('getLandUse_list', {
    });
    expect(result.obj).toEqual(testResponse);
  });

  test('return the error object', async () => {
    expect.assertions(1);

    try {
      class TestAPI extends BaseTestAPI {
        checkFail() {
          return true;
        }
      }
      const api = await new TestAPI(schema, {
        returnResponse: true,
      });
      await api.epoint('getLandUse_list');
    } catch (e) {
      expect(e.status).toBe(400);
    }
  });
});

// test that returnResponse modifies
// responses structure
describe('option errorOnFail', () => {
  test('return the error object', async () => {
    expect.assertions(1);

    try {
      class TestAPI extends BaseTestAPI {
        checkFail() {
          return true;
        }
      }
      const api = await new TestAPI(schema, {
        errorOnFail: false,
      });
      await api.epoint('getLandUse_list');
    } catch (e) {
      expect(e.status).toBe(400);
    }
  });

  test('return the error object', async () => {
    expect.assertions(1);

    try {
      class TestAPI extends BaseTestAPI {
        checkFail() {
          return true;
        }
      }
      const api = await new TestAPI(schema, {
        errorOnFail: true,
      });
      await api.epoint('getLandUse_list');
    } catch (e) {
      expect(e instanceof Error).toBe(true);
    }
  });
});

// test a middleware can hijack a request before
// swagger gets it
describe('middleware onCall', () => {
  test('hijack request', async () => {
    expect.assertions(1);

    class TestAPI extends BaseTestAPI {
      get middlewares() {
        return [
          HijackMiddleware,
        ];
      }
    }
    const api = await new TestAPI(schema, {
      hijack: true,
    });
    const result = await api.epoint('getLandUse_list', {
      hijack: true,
    });

    expect(result).toEqual({
      hijacked: true,
    });
  });
});

// test a middleware can modify a request
describe('middleware onRequest', () => {
  test('modify request', async () => {
    expect.assertions(1);

    const token = 'foo';
    class TestAPI extends BaseTestAPI {
      get middlewares() {
        return [
          JWTMiddleware,
        ];
      }

      fetch(url, options) {
        expect(options.headers.Authorization).toEqual(`Bearer ${token}`);
        return super.fetch(url, options);
      }
    }
    const api = await new TestAPI(schema, {
      jwt: {
        token,
      },
    });
    await api.epoint('getLandUse_list');
  });
});

// test a middleware can modify a response
describe('middleware onResponse', () => {
  test('modify response', async () => {
    expect.assertions(1);

    class TestAPI extends BaseTestAPI {
      get middlewares() {
        return [
          ContentMiddleware,
        ];
      }
    }

    const api = await new TestAPI(schema, {
      content: true,
    });
    const result = await api.epoint('getLandUse_list');
    expect(result.content).toBe(true);
  });
});

// test a cancelation
describe('cancelation', () => {
  class TestAPI extends BaseTestAPI {
    get middlewares() {
      return [
        DelayMiddleware,
      ];
    }
  }

  test('manual cancelation', async () => {
    expect.assertions(1);

    const api = await new TestAPI(schema, {
      delay: true,
    });

    const controller = getController({
      id: 'getLandUse_list',
      name: 'foo',
    });

    await new Promise((resolve) => {
      api.epoint(controller)
        .catch((e) => {
          expect(e instanceof Error).toBe(true);
          resolve();
        });
      api.cancel(controller);
    });
  });

  test('auto cancelation', async () => {
    expect.assertions(2);

    const api = await new TestAPI(schema, {
      delay: true,
    });

    const controllerData = {
      id: 'getLandUse_list',
      name: 'foo',
    };

    await new Promise((resolve) => {
      api.epoint(getController(controllerData))
        .then((result) => {
          expect(result).toEqual(testResponse);
        });
      api.epoint(getController(controllerData))
        .then((result) => {
          expect(result).toEqual(testResponse);
          resolve();
        });
    });
  });

  test('auto cancelation clean', async () => {
    expect.assertions(2);

    const api = await new TestAPI(schema, {
      delay: true,
    });

    const controllerData = {
      id: 'getLandUse_list',
      name: 'foo',
      clean: true,
    };

    await new Promise((resolve) => {
      api.epoint(getController(controllerData))
        .catch((e) => {
          expect(e instanceof Error).toBe(true);
        });
      api.epoint(getController(controllerData))
        .then((result) => {
          expect(result).toEqual(testResponse);
          resolve();
        });
    });
  });

  test('mix situation', async () => {
    expect.assertions(2);

    const api = await new TestAPI(schema, {
      delay: true,
    });

    const controllerData = {
      id: 'getLandUse_list',
      name: 'foo',
      clean: true,
    };

    await new Promise((resolve) => {
      api.epoint('getLandUse_list')
        .then((result) => {
          expect(result).toEqual(testResponse);
        });
      api.epoint(getController(controllerData))
        .then((result) => {
          expect(result).toEqual(testResponse);
          resolve();
        });
    });
  });
});
