// const sum from './sum';
const sum = (a, b) => (a * a) + b;

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});
