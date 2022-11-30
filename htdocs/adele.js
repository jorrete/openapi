import API from '..';
import JWTMiddleware from '../src/middleware/jwt';
import HijackMiddleware from '../src/test/hijack';
import ContentMiddleware from '../src/test/content';

class AdeleAPI extends API {
  get middlewares() {
    return [
      HijackMiddleware,
      JWTMiddleware,
      ContentMiddleware,
    ];
  }
}

export default AdeleAPI;
