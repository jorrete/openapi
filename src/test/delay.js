import Middleware from '../middleware/base';

// Since in testing we donp't actullay call any server
// and fake the fetch api we need a way to delay
// the request.
// This middleware will hold the flow a few ms
// that will allow us to test the cancelation pipeline
// without doing a real request call

class DelayMiddleware extends Middleware {
  static get id() {
    return 'delay';
  }

  onCall() {
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
}

export default DelayMiddleware;
