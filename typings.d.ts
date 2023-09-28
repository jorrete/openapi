// `spec` | `Object`, **REQUIRED**. OpenAPI definition represented as [POJO](https://en.wikipedia.org/wiki/Plain_old_Java_object).
// `operationId` | `String`. Unique string used to identify an operation. If not provided, `pathName` + `method` must be used instead.
// `pathName` | `String`. OpenAPI defines a unique operation as a combination of a path and an HTTP method. If `operationId` is not provided, this property must be set.
// `method` | `String=["GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"]`. OpenAPI defines a unique operation as a combination of a path and an HTTP method. If `operationId` is not provided, this property must be set.
// `parameters` | `Object`. Parameters object, eg: `{ q: 'search string' }`. Parameters not defined in `spec` will be ignored.
// `parameterBuilders` | `Object=null`. When provided in shape of `{ body: Function, header: Function, query: Function, path: Function, formData: Function }`, it can fully conltrol how parameters of various types are built. This library comes with two default parameter builders: [OpenAPI 2.x builders](https://github.com/swagger-api/swagger-js/blob/master/src/execute/swagger2/parameter-builders.js) and [OpenAPI 3.0.x builders](https://github.com/swagger-api/swagger-js/blob/master/src/execute/oas3/parameter-builders.js).
// `securities` | `Object`. Maps security schemes to a request. Securities not defined in `spec` will be ignored. <br/><br/>*Examples*<br /><br /> *Bearer:* `{ authorized: { BearerAuth: {value: "3492342948239482398"} } }` <br /><br /> *Basic:* `{ authorized: { BasicAuth: { username: 'login', password: 'secret' } } }` <br /><br /> *ApiKey:* `{ authorized: { ApiKey: { value: '234934239' } } }` <br /><br /> *oAuth2:* `{ authorized: { oAuth2: { token: { access_token: '234934239' } } } }`
// `requestInterceptor` | `Function=identity`. Either synchronous or asynchronous function transformer that accepts `Request` and should return `Request`.
// `responseInterceptor` | `Function=identity`. Either synchronous or asynchronous function transformer that accepts `Response` and should return `Response`.
// `requestContentType` | `String`. Sets [appropriate media type](https://swagger.io/docs/specification/describing-request-body/) for request body, e.g. `application/json`. If supplied media type is not defined for the request body, this property is ignored.
// `responseContentType` | `String`. Expect [appropriate media type](https://swagger.io/docs/specification/describing-responses/) response, e.g. `application/json`. Creates an `Accept` header in `Request` object.
// `attachContentTypeForEmptyPayload` | `Boolean=false`. Attaches a `Content-Type` header to a `Request` even when no payload was provided for the `Request`.
// `http` | `Function=Http`. A function with an interface compatible with [HTTP Client](http-client.md).
// `userFetch` | `Function=cross-fetch`. Custom **asynchronous** fetch function that accepts two arguments: the `url` and the `Request` object and must return a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object. More info in [HTTP Client](http-client.md) documentation.

declare module 'swagger-client' {
  type SwaggerSpec = {
    spec: object
  };

  type SwaggerOptions = {
    parameters?: object,
    securities?: object,
    requestInterceptor?: (request: Request) => Request | Promise<Request>
    responseInterceptor?: (request: Response) => Response | Promise<Response>
    requestContentType?: string,
    responseContentType?: string,
    userFetch?: typeof fetch,
  };

  type SwaggerInterface = SwaggerOptions & (
    {
      operationId: string,
    }
    | {
      pathName: string,
      method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH' ,
    }
  );

  type SwaggerExecute<I> = (options: I) => Promise<void>;

  export type SwaggerClientInstance = Promise<{
    execute: SwaggerExecute<SwaggerInterface>;
  }>;

  class SwaggerClient {
    constructor(options: SwaggerOptions & SwaggerSpec)

    client: SwaggerClientInstance;

    static execute: SwaggerExecute<SwaggerInterface & SwaggerSpec>;
  }

  export = SwaggerClient
}
