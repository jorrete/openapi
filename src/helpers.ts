type callback = () => Promise<unknown> | unknown;

/**
 * Given a list of promised callback, creates a generator
 * to be able to consume the loop at will.
 *
 * @generator
 * @param {Promise[]} list List of promise callbacks
 * @yields {Promise}
 */
export function* promisedGenerator(list: callback[]) {
  const generators = list.slice();
  while (generators.length) {
    const callback = generators.shift();
    if (typeof callback !== 'function') {
      throw Error('Not a function');
    }
    yield Promise.resolve(callback());
  }
}

/**
 * @param {Function} gen Generator yielding promises
 * @param {Array} results Array where results are stored
 * @returns {Array} Results resutls
 */
export function consumePromisedGenerator(gen: Generator<Promise<unknown>>, results: unknown[] = []): Promise<unknown[]> {
  const result = gen.next();

  if (result.done) {
    return Promise.resolve(results);
  }

  return result.value
    .then((value: unknown) => {
      results.push(value);
      return consumePromisedGenerator(gen, results);
    });
}

/**
 * Receiving an array of callbacks returning promises,
 * it will loopt over the array fullfilling the promises in order.
 *
 * @param {Array} list List of promise callbacks
 * @returns {Promise} Promise with array of resutls
 */
export function promisedList(list: callback[]): Promise<unknown[]> {
  // wrap in a promise in case of list is empty
  return consumePromisedGenerator(promisedGenerator(list));
}
