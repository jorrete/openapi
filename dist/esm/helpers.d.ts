type callback = () => Promise<unknown> | unknown;
/**
 * Given a list of promised callback, creates a generator
 * to be able to consume the loop at will.
 *
 * @generator
 * @param {Promise[]} list List of promise callbacks
 * @yields {Promise}
 */
export declare function promisedGenerator(list: callback[]): Generator<Promise<unknown>, void, unknown>;
/**
 * @param {Function} gen Generator yielding promises
 * @param {Array} results Array where results are stored
 * @returns {Array} Results resutls
 */
export declare function consumePromisedGenerator(gen: Generator<Promise<unknown>>, results?: unknown[]): Promise<unknown[]>;
/**
 * Receiving an array of callbacks returning promises,
 * it will loopt over the array fullfilling the promises in order.
 *
 * @param {Array} list List of promise callbacks
 * @returns {Promise} Promise with array of resutls
 */
export declare function promisedList(list: callback[]): Promise<unknown[]>;
export {};
