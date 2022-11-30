/**
 * Given a list of promised callback, creates a generator
 * to be able to consume the loop at will.
 *
 * @generator
 * @param {Promise[]} list List of promise callbacks
 * @yields {Promise}
 */
function* promisedGenerator(list) {
  while (list.length) {
    const callback = list.shift();
    if (typeof callback !== 'function') {
      throw Error('Not a function');
    }
    yield Promise.resolve(callback());
  }
}

export default promisedGenerator;
