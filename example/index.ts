import SwaggerClient, { SwaggerError, SwaggerInterface } from 'swagger-client';

import { SwaggerAPI, SwaggerAPIMiddleware } from '../src/api';

class TestMiddleware extends SwaggerAPIMiddleware<{ mode: 'off' | 'on'}> {
  onExecute(context: SwaggerInterface): SwaggerClient.SwaggerInterfaceContext {
    console.log(this.options.mode, this.api);
    if (context.requestBody) {
      context.requestBody.caca = true;
    }

    return context;
  }
  onFetch(context: SwaggerClient.SwaggerInterface): Promise<Response> | void {
    if (!('operationId' in context)) {
      return;
    }

    if (context.operationId !== 'getUserByName' || context.parameters?.username !== 'theUser2') {
      return;
    }

    return Promise.resolve(
      new Response(
        JSON.stringify({
          fake: true,
        }),
        {
          status: 200,
          statusText: 'OK',
        },
      ),
    );
  }
  onRequest(_: never, request: SwaggerClient.SwaggerRequest): SwaggerClient.SwaggerRequest {
    request.credentials = 'omit';
    return request;
  }
  onResponse(_: never, response: SwaggerClient.SwaggerResponse): SwaggerClient.SwaggerResponse {
    response.obj['foo'] = true;

    return response;
  }
}

(async () => {
  const spec = await (await fetch('http://localhost:8080/api-docs')).json();

  const api = new SwaggerAPI({
    middlewares: [
      new TestMiddleware({
        mode: 'on',
      }),
    ],
    spec,
  });

  type User = { username: string };

  try {
    await api.execute({
      operationId: 'createUser',
    });
  } catch (error) {
    console.log((error as SwaggerError).response);
    console.log((error as SwaggerError).status);
    console.log((error as SwaggerError).message);
  }

  const resultError = await api.execute({
    failAsResponse: true,
    operationId: 'createUser',
  });

  console.log({
    resultError,
  });

  const user0 = await api.execute<User>({
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

  console.log({
    user0: user0.obj.username,
  });

  const user1 = await api.execute({
    operationId: 'getUserByName',
    parameters: {
      username: 'theUser1',
    },
  });

  console.log({
    user1,
  });

  const user2 = await api.execute({
    operationId: 'getUserByName',
    parameters: {
      username: 'theUser2',
    },
  });

  console.log({
    user2,
  });
})();
