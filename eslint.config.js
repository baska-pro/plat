'use strict';
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', '_site/**'] },
  js.configs.recommended,
  {
    // Kode aplikasi: skrip biasa di browser; modul UMD juga bisa dimuat lewat require() di Node.
    files: ['js/**/*.js', 'sw.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.serviceworker, module: 'writable', require: 'readonly' }
    },
    rules: { 'no-var': 'off', 'no-empty': ['error', { allowEmptyCatch: true }], 'no-unused-vars': ['error', { caughtErrors: 'none' }] }
  },
  {
    files: ['scripts/**/*.js', 'tests/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node, axe: 'readonly', document: 'readonly', window: 'readonly' } },
    rules: { 'no-empty': ['error', { allowEmptyCatch: true }], 'no-unused-vars': ['error', { caughtErrors: 'none' }] }
  }
];
