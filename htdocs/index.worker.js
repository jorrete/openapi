import { transfer, expose } from 'comlink/dist/esm/comlink.mjs';
import AdeleAPI from './adele';

class AdeleAPIWorker extends AdeleAPI {
  prepareResult(result) {
    return transfer(result);
  }
}

expose({ API: AdeleAPIWorker });
