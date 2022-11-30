import promisedFind from '.';

test('success', async () => {
  expect.assertions(1);

  const find = await promisedFind([
    () => Promise.resolve(),
    () => Promise.resolve(2),
  ]);
  expect(find).toEqual(2);
});

test('no find', async () => {
  expect.assertions(1);

  const find = await promisedFind([
    () => Promise.resolve(),
    () => Promise.resolve(0),
  ]);
  expect(find).toEqual(undefined);
});

test('fail', async () => {
  expect.assertions(1);

  try {
    await promisedFind([
      () => Promise.reject(new Error()),
      () => Promise.resolve(2),
    ]);
  } catch (e) {
    expect(e instanceof Error).toBe(true);
  }
});
