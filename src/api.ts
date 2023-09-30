import SwaggerClient, {
  SwaggerClientInstance,
  SwaggerError,
  SwaggerInterface,
  SwaggerRequest,
  SwaggerResponse,
  SwaggerResponseEror,
  SwaggerSpec,
} from 'swagger-client';

import { promisedList } from './helpers';

export abstract class SwaggerAPIMiddleware<O = unknown> {
  api!: SwaggerAPI;

  options: O;

  constructor(options: O) {
    this.options = options || {} as O;
  }

  onExecute?(context: SwaggerInterface): SwaggerInterface;
  onFetch?(context: SwaggerInterface, url: string, request: SwaggerRequest): Promise<Response> | void;
  onRequest?(context: SwaggerInterface, request: SwaggerRequest): SwaggerRequest;
  onResponse?(context: SwaggerInterface, response: SwaggerResponse): SwaggerResponse;
}

type FailAsResponse = {
  failAsResponse?: boolean;
}

export type SwaggerAPIOptions = (
  SwaggerSpec
  & FailAsResponse
  & {
    middlewares?: SwaggerAPIMiddleware[],
  }
);

export function restoreSwaggerException(response: SwaggerResponseEror) {
  const error = new Error() as SwaggerError;
  error.message = response.obj.message;
  error.response = response;
  error.status = response.status;
  error.statusCode = response.status;
  throw error;
}

export class SwaggerAPI{
  client: SwaggerClientInstance;

  middlewares: SwaggerAPIMiddleware[] = [];

  options: SwaggerAPIOptions;

  constructor(options: SwaggerAPIOptions) {
    this.options = {
      failAsResponse: false,
      middlewares: [],
      ...options,
    };

    const api = new SwaggerClient({
      spec: options.spec,
    });

    this.client = api.client;

    this.middlewares = this.options.middlewares as SwaggerAPIMiddleware[];

    this.middlewares?.forEach((middleware) => {
      middleware.api = this;
    });
  }

  async execute<T = unknown>(options: SwaggerInterface & FailAsResponse): Promise<SwaggerResponse<T>> {
    try {
      await promisedList(this.middlewares.filter((middleware) => middleware.onExecute).map((middleware) => {
        return () => {
          if (!middleware.onExecute) {
            return options;
          }

          options = middleware.onExecute(options);

          return options;
        };
      }));

      return await (await this.client).execute({
        ...options,
        requestInterceptor: async (request) => {
          await promisedList(this.middlewares.filter((middleware) => middleware.onRequest).map((middleware) => {
            return () => {
              if (!middleware.onRequest) {
                return request;
              }

              request = middleware.onRequest(options, request);

              return request;
            };
          }));

          return request;
        },
        responseInterceptor: async (response) => {
          await promisedList(this.middlewares.filter((middleware) => middleware.onRequest).map((middleware) => {
            return () => {
              if (!middleware.onResponse) {
                return response;
              }

              response = middleware.onResponse(options, response);

              return response;
            };
          }));

          return response;
        },
        userFetch: async (url, request) => {
          let customFetch;

          await promisedList(this.middlewares.filter((middleware) => middleware.onFetch).map((middleware) => {
            return () => {
              if (!middleware.onFetch) {
                return;
              }

              customFetch = middleware.onFetch(options, url, request);

              return customFetch;
            };
          }));

          return customFetch || fetch(url, request);
        },
      });
    } catch (error) {
      if (this.options.failAsResponse || options.failAsResponse) {
        // this should be used when running in worker
        // and exception be restored
        return (error as SwaggerError).response;
      }

      throw error;
    }
  }
}
