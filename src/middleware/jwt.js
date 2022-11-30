import SwaggerClient from 'swagger-client';

import Middleware from './base';

function getToken({
  path,
  username,
  password,
}) {
  return SwaggerClient.http({
    url: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

function addAuthorizationHeader(request, token) {
  Object.assign(request.headers, {
    'Authorization': `Bearer ${token}`,
  });
  return request;
}

function getSchema({
  path,
  token,
}) {
  const request = addAuthorizationHeader({
    url: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }, token);
  return SwaggerClient.http(request);
}

class JWTMiddleware extends Middleware {
  static get id() {
    return 'jwt';
  }

  onRequest(request) {
    Object.assign(request.headers, {
      'Authorization': `Bearer ${this.options.token}`,
    });
    return addAuthorizationHeader(request, this.options.token);
  }
}

export { JWTMiddleware as default, getToken, getSchema };
