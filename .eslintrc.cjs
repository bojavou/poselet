module.exports = {
  extends: 'standard',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  env: {
    browser: false,
    commonjs: false,
    node: true
  },
  globals: {
    document: 'off',
    navigator: 'off',
    window: 'off'
  }
}
