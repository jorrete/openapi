import promisedGenerator from '.';

test('success', async () => {
  expect.assertions(1);

  const gen = await promisedGenerator([
    () => Promise.resolve(1),
  ]);
  const result = await gen.next().value;
  expect(result).toBe(1);
});
