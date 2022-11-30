/* eslint consistent-return: off */
import Middleware from '../middleware/base';

class HijackMiddleware extends Middleware {
  static get id() {
    return 'hijack';
  }

  onCall(context) {
    if (typeof context.options.hijack !== 'boolean') {
      return;
    }

    if (context.options.hijack) {
      return this.createSuccessResponse(200, {
        hijacked: true,
      });
    }

    return this.createFailedResponse(400, {
      hijacked: true,
    });
  }
}

export default HijackMiddleware;
