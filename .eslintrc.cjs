module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'import/no-extraneous-dependencies': ['error', { devDependencies: true, optionalDependencies: false, peerDependencies: false }],
    'no-restricted-syntax': [0, 'FunctionExpression', 'WithStatement', "BinaryExpression[operator='in']"],
    'guard-for-in': 0,
    'prefer-rest-params': 0,
    'no-plusplus': 0,
    'import/extensions': 0,
    'class-methods-use-this': 0,
    'new-parens': 0,
    'import/prefer-default-export': 0,
  },
};
