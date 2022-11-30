import promisedGenerator from '../promisedGenerator';

/**
 * @param {Function} gen Generator yielding promises
 * @param {Array} results Array where results are stored
 * @returns {Array} Results resutls
 */
function consumePromisedGenerator(gen, results = []) {
  const result = gen.next();

  if (result.done) {
    return results;
  }

  return result.value
    .then((value) => {
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
function promisedList(list) {
  // wrap in a promise in case of list is empty
  return Promise.resolve(consumePromisedGenerator(promisedGenerator(list)));
}

export default promisedList;
