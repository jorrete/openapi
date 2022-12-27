class Middleware {
  // TODO see if we can reuse swagger-client machinery
  createResponseObject(code, data) {
    // TODO return binary
    // TODO return non json
    return {
      code,
      // should consider 300 (redirects) ???
      ok: code < 400,
      obj: data,
    };
  }

  createSuccessResponse(code, data) {
    // TODO check valid code
    return this.createResponseObject(code, data);
  }

  createFailedResponse(code, data) {
    // TODO check valid code
    return Object.assign(new Error(), {
      response: this.createResponseObject(code, data),
    });
  }

  static get id() {
    throw Error(`Implement id in ${this.name}`);
  }

  constructor(options = {}) {
    this.options = options;
  }

  checkCall() {
    return true;
  }

  onCall() {
    void 0;
  }

  checkRequest() {
    return true;
  }

  onRequest(request) {
    return request;
  }

  checkFetch() {
    return true;
  }

  onFetch(promise) {
    return promise;
  }

  checkResponse() {
    return true;
  }

  onResponse(response) {
    return response;
  }
}

export default Middleware;
