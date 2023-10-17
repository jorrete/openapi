import SwaggerClient from 'swagger-client';

import { promisedList } from './helpers';
export class SwaggerAPIMiddleware {
  api;
  options;
  constructor(options) {
    this.options = options || {};
  }
}
export function restoreSwaggerException(response) {
  const error = new Error();
  error.message = response.obj.message;
  error.response = response;
  error.status = response.status;
  error.statusCode = response.status;
  throw error;
}
export class SwaggerAPI {
  client;
  middlewares = [];
  options;
  constructor(options) {
    this.options = {
      failAsResponse: false,
      middlewares: [],
      ...options,
    };
    const api = new SwaggerClient({
      spec: options.spec,
    });
    this.client = api.client;
    this.middlewares = this.options.middlewares;
    this.middlewares?.forEach((middleware) => {
      middleware.api = this;
    });
  }
  async execute(options) {
    console.log('--------------------------', options);
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
      console.log('--------------------------2', options);
      return (await this.client).execute({
        ...options,
        requestInterceptor: async (request) => {
          await promisedList(this.middlewares.filter((middleware) => middleware.onRequest).map((middleware) => {
            return () => {
              if (!middleware.onRequest) {
                return request;
              }
              console.log('--------------------------3', options, request);
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
          console.log('--------------------------4', request);
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
    }
    catch (error) {
      if (this.options.failAsResponse || options.failAsResponse) {
        // this should be used when running in worker
        // and exception be restored
        return error.response;
      }
      throw error;
    }
  }
}
