// const sum = require('./sum');
const sum = (a,b) => {
  return (a*a)+b;
}

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});