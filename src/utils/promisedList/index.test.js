import promisedList from '.';

test('success', async () => {
  expect.assertions(1);

  const list = await promisedList([
    () => Promise.resolve(1),
    () => Promise.resolve(2),
  ]);
  expect(list).toEqual([1, 2]);
});

test('fail', async () => {
  expect.assertions(1);

  try {
    await promisedList([
      () => Promise.reject(new Error()),
      () => Promise.resolve(2),
    ]);
  } catch (e) {
    expect(e instanceof Error).toBe(true);
  }
});

test('timing', async () => {
  expect.assertions(1);

  const list = await promisedList([
    () => new Promise((resolve) => {
      const timeStamp = new Date().getTime();
      setTimeout(() => resolve(timeStamp), 100);
    }),
    () => new Promise((resolve) => {
      const timeStamp = new Date().getTime();
      resolve(timeStamp);
    }),
  ]);
  expect(list[1] - list[0]).toBeGreaterThanOrEqual(100);
});

test('empty', () => {
  const list = promisedList([]);
  expect(typeof list.then === 'function').toBe(true);
});
