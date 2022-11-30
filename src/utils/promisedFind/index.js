/* eslint consistent-return: off */
import promisedGenerator from '../promisedGenerator';

/**
 * @param {Function} gen Generator yielding promises
 * @returns {*} Results the value (if any) of the first match
 */
function findInPromisedGenerator(gen) {
  const result = gen.next();

  if (result.done) {
    return;
  }

  return result.value.then((value) => {
    if (value) {
      return value;
    }

    return findInPromisedGenerator(gen);
  });
}

/**
 * Receiving an array of callbacks returning promises,
 * it will loopt over and return a promise with the result of
 * the first match.
 *
 * @param {Array} list List of promise callbacks
 * @returns {Promise} Promise with array of resutls
 */
function promisedFind(list) {
  // wrap in a promise in case of list is empty
  return Promise.resolve(findInPromisedGenerator(promisedGenerator(list)));
}

export default promisedFind;
