import SwaggerClient from 'swagger-client';
import getUUID from './utils/getUUID';
import promisedList from './utils/promisedList';
import promisedFind from './utils/promisedFind';
import { CancelError } from './errors';

// TODO returnResponse is working well for json responses but must cover other
// response types

/**
 * @param options
 */
function buildController(options) {
  if (!options.id) {
    throw Error('Missing endpoint id');
  }

  return {
    ...options,
    instance: getUUID(),
  };
}

/**
 * @param options
 */
function getController(options) {
  if (!options.name) {
    throw Error('Missing endpoint name');
  }

  return buildController(options);
}

/**
 * API.
 */
class API {
  /**
   * constructor.
   *
   * @param {object} schema OpenAPI schema object
   * @param {object} options API options
   * @param {boolean} options.errorOnFail If true throws an Error on non succesful api calls
   * @param {boolean} options.returnResponse If true returns the responseObj instead of the result
   */
  constructor(schema, options = {}) {
    this.options = {
      errorOnFail: false,
      returnResponse: false,
      debug: false,
      ...options,
    };

    this.client = new SwaggerClient({ spec: schema });
    this.middlewareInstances = this.middlewares
      .filter((Middleware) => Boolean(this.options[Middleware.id]))
      .map((Middleware) => new Middleware({
        ...(typeof this.options[Middleware.id] === 'object' ? this.options[Middleware.id] : {}),
        debug: this.options.debug,
      }));
    this.requestControllers = new Map();

    if (this.options.debug) {
      console.log('[API]', this, schema);
    }
  }

  get middlewares() {
    return [];
  }

  getResponseData(responseObj) {
    if (responseObj.obj) {
      return responseObj.obj;
    }
    return responseObj.data;
  }

  buildResponseObj(data) {
    return { obj: data };
  }

  prepareResult(result) {
    return result;
  }

  fetchFunction = fetch;

  fetch(url, requestOptions, ref, context) {
    const abortController = new AbortController();

    // mandatory: must update ref with cancel request method
    Object.assign(ref, {
      cancel: () => abortController.abort(),
    });

    Object.assign(requestOptions, {
      signal: abortController.signal,
      mode: 'cors',
      // credentials: 'include',
      credentials: 'omit',
    });

    return this.fetchFunction(url, requestOptions, context)
      .catch((error) => {
        // mandatory: cancel error must be CancelError
        if (error instanceof DOMException) {
          // make cancel error recognizable
          return Promise.reject(new CancelError());
        }
        return Promise.reject(error);
      });
  }

  getRef(controller) {
    return this.requestControllers
      .get(controller.id)
      .get(controller.instance);
  }

  delRef(controller) {
    return this.requestControllers
      .get(controller.id)
      .delete(controller.instance);
  }

  setRef(controller) {
    // init endpoint controller if not initialized
    if (!this.requestControllers.has(controller.id)) {
      this.requestControllers.set(controller.id, new Map());
    }

    // if configured clean previous calls with same controller id
    if (controller.clean) {
      // cancel those wich id and name are the same
      this.requestControllers.get(controller.id).forEach((ref) => {
        if (ref.controller.name && controller.name && ref.controller.name === controller.name) {
          this.cancel(ref.controller);
        }
      });
    }

    this.requestControllers.get(controller.id).set(controller.instance, {
      controller,
      cancel: (_controller) => {
        const ref = this.getRef(_controller);
        if (ref.override) {
          throw Error('Implement me when override "fetch"');
        }
      },
    });
  }

  cancel(controller) {
    // Wait to client, if not we could be trying to cancel before the call is done
    return this.client.then(() => {
      const ref = this.getRef(controller);
      if (!ref) {
        throw Error('controller already resolved');
      }
      ref.cancel(controller);
      ref.canceled = true;
    });
  }

  _doRequest(context) {
    return this.client.then((client) => client.execute({
      ...context.options,
      operationId: context.id,
      userFetch: (url, requestOptions) => {
        const ref = this.getRef(context.controller);
        Object.assign(ref, {
          override: true,
        });
        const fetchPromise = this.fetch(url, requestOptions, ref, context);

        const middlewares = this.middlewareInstances
          .slice()
          .filter((middleware) => middleware.checkFetch(url, requestOptions, context))
          .map((middleware) => (() => middleware.onFetch(
            fetchPromise, url, requestOptions, context,
          )));

        return promisedList(middlewares).then(() => fetchPromise);
      },
      requestInterceptor: (requestObj) => {
        const middlewares = this.middlewareInstances
          .slice()
          .filter((middleware) => middleware.checkRequest(context))
          .map((middleware) => (() => middleware.onRequest(requestObj, context)));

        return promisedList(middlewares).then(() => requestObj);
      },
      responseInterceptor: (responseObj) => {
        const middlewares = this.middlewareInstances
          .slice()
          .reverse()
          .filter((middleware) => middleware.checkResponse(context))
          .map((middleware) => (() => middleware.onResponse(responseObj, context)));

        return promisedList(middlewares).then(() => responseObj);
      },
    }));
  }

  _checkCall(context) {
    const middlewares = this.middlewareInstances
      .slice()
      .filter((middleware) => middleware.checkCall(context))
      .map((middleware) => (() => middleware.onCall(context)));
    return promisedFind(middlewares);
  }

  /**
   * Call OpenApi endpoint.
   * <br>{@link https://github.com/swagger-api/swagger-js/blob/HEAD/docs/usage/try-it-out-executor.md}
   *
   * @param {string|object} id OpenAPI endpoint id, can be and id string or a controller object
   * @param {object} options Endpoint request parameters
   * @returns {Promise} Endpint result
   */
  epoint(id, options = {}) {
    const controller = typeof id === 'object' ? id : buildController({ id });
    const context = {
      id: controller.id,
      options,
      controller,
    };

    if (this.options.debug) {
      console.log('[API][endpoint]', context, options);
    }

    this.setRef(controller);

    return new Promise((resolve, reject) => this._checkCall(context)
      .then((hijackedResponse) => {
        // it could be already canceled
        const ref = this.getRef(controller);
        if (ref.canceled) {
          return reject(new CancelError());
        }

        // if there is an hijackedResponse it means that
        // som middleware has hijacked the request flow and it's
        // returning a pair defining status and result
        if (hijackedResponse) {
          return (hijackedResponse.ok ? resolve : reject)(hijackedResponse);
        }

        // do de actual request
        return this._doRequest(context)
          .then(resolve)
          .catch(reject);
      }))
      // return the result
      .then((responseObj) => {
        this.delRef(controller);
        return this.prepareResult(
          this.options.returnResponse ? responseObj : this.getResponseData(responseObj),
        );
      })
      // return error but check first how to return it
      .catch((error) => {
        this.delRef(controller);
        if (this.options.errorOnFail) {
          return Promise.reject(error);
        }

        if (error.response) {
          return Promise.reject(error.response);
        }
        return Promise.reject(error);
      });
  }
}

export { API as default, getController };
