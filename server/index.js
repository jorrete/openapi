'use strict';

var path = require('path');
var http = require('http');
var cors = require('cors');
var express = require('express');

var oas3Tools = require('oas3-tools');
var serverPort = 8080;

// swaggerRouter configuration
var options = {
  routing: {
    controllers: path.join(__dirname, './controllers'),
  },
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);

const openApiApp = expressAppConfig.getApp();

const app = express();

// Add headers
app.use(/.*/, cors());

for (let i = 2; i < openApiApp._router.stack.length; i++) {
  app._router.stack.push(openApiApp._router.stack[i]);
}

function server() {
  return new Promise((resolve) => {
    const server = http.createServer(app).listen(serverPort, function () {
      console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
      console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
      resolve(server);
    });
  });
}
// Initialize the Swagger middleware

module.exports = {
  server,
};
