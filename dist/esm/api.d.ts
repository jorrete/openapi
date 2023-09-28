import { SwaggerClientInstance, SwaggerInterface, SwaggerRequest, SwaggerResponse, SwaggerResponseEror, SwaggerSpec } from 'swagger-client';
export declare abstract class SwaggerAPIMiddleware<O = unknown> {
    api: SwaggerAPI;
    options: O;
    constructor(options: O);
    onExecute?(context: SwaggerInterface): SwaggerInterface;
    onFetch?(context: SwaggerInterface, url: string, request: SwaggerRequest): Promise<Response> | void;
    onRequest?(context: SwaggerInterface, request: SwaggerRequest): SwaggerRequest;
    onResponse?(context: SwaggerInterface, response: SwaggerResponse): SwaggerResponse;
}
type FailAsResponse = {
    failAsResponse?: boolean;
};
type SwaggerAPIOptions = (SwaggerSpec & FailAsResponse & {
    middlewares?: SwaggerAPIMiddleware[];
});
export declare function restoreSwaggerException(response: SwaggerResponseEror): void;
export declare class SwaggerAPI {
    client: SwaggerClientInstance;
    middlewares: SwaggerAPIMiddleware[];
    options: SwaggerAPIOptions;
    constructor(options: SwaggerAPIOptions);
    execute<T = unknown>(options: SwaggerInterface & FailAsResponse): Promise<SwaggerResponse<T>>;
}
export {};
