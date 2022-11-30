import { wrap } from 'comlink/dist/esm/comlink.mjs';

import { getController } from '..';
import { getToken, getSchema } from '../src/middleware/jwt';
import AdeleAPI from './adele';

const { API } = wrap(new Worker('worker.js'));
const APIMain = AdeleAPI;

(async function init() {
  /**
   * @param api
   */
  async function makeCalls(api) {
    // normal call
    api.epoint('getLandUse_list')
      .then((response) => console.log('success', response))
      .catch((error) => console.log('error', error));

    api.epoint('getFilterDataTable_retrieve', {
      parameters: {
        dashboard: 'network_measurements',
      },
    })
      .then((response) => console.log('success', response))
      .catch((error) => console.log('error', error));

    // hijack with middleware
    api.epoint('getLandUse_list', {
      hijack: true,
    })
      .then((response) => console.log('success', response))
      .catch((error) => console.log('error', error));

    // cancel
    const controller = getController({
      id: 'getLegends_create',
      name: 'foo',
    });
    api.epoint(controller, {
      requestBody: {
        Dashboard: 'network_topology',
        Metric: 'network_topology',
        Resolution: 100,
        Technology: 'LTE',
      },
    })
      .then((response) => console.log('success', response))
      .catch((error) => console.log('error', error));
    api.cancel(controller);

    // auto cancel
    const controllerData = {
      id: 'getLandUse_list',
      name: 'bar',
      clean: true,
    };

    api.epoint(getController({ ...controllerData }))
      .then((response) => console.log('success', response))
      .catch((error) => console.log('error', error));

    api.epoint(getController({ ...controllerData }))
      .then((response) => console.log('success', response))
      .catch((error) => console.log('error', error));
  }

  const credentials = (await getToken({
    path: 'http://localhost:9000/api/v0/authenticate',
    username: 'admin@fake.com',
    password: 'admin',
  })).obj;

  const schema = (await getSchema({
    path: 'http://localhost:9000/api/v0/schema/',
    token: credentials.access,
  })).obj;

  schema.servers = [
    {
      url: 'http://localhost:9000',
      description: 'server',
    },
  ];

  const options = {
    // errorOnFail: true,
    // returnResponse: true,
    jwt: {
      token: credentials.access,
    },
    delay: true,
    hijack: true,
    debug: true,
  };

  const apiMain = await new APIMain(schema, options);
  const apiWorker = await new API(schema, options);

  makeCalls(apiMain);
  makeCalls(apiWorker);
}());
