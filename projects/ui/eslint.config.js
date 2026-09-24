// @ts-check
const { defineConfig } = require('eslint/config');
const rootConfig = require('../../eslint.config.js');

module.exports = defineConfig([
  ...rootConfig,
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'ui', style: 'camelCase' }],
      // Attribute components on native elements (button[uiButton]) opt out per line with a reason.
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'ui', style: 'kebab-case' }],
      // Attribute directives prefix their extra inputs with the directive name
      // (uiRovingFocusItemDisabled) to avoid collisions on shared host elements.
      '@angular-eslint/no-input-rename': 'off',
    },
  },
]);
