/* eslint import/prefer-default-export: off */
class CancelError extends Error {
  constructor() {
    super('Request canceled');
  }
}

export { CancelError };
