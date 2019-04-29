module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true
  },
  plugins: ["mocha"],
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    "mocha/no-exclusive-tests": "error"
  }
};
