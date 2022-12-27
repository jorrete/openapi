import Middleware from '../../src/middleware/base';

class ContentMiddleware extends Middleware {
  static get id() {
    return 'content';
  }

  onResponse(response) {
    Object.assign(response.obj, {
      content: true,
    });
    return response;
  }
}

export default ContentMiddleware;
