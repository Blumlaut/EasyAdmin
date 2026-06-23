import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import tailwindcss from 'eslint-plugin-tailwindcss'
import nuiPlugin from './eslint-plugin-nui.mjs'

export default tseslint.config(
  // Base configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,

  {
    ignores: ['dist/', 'node_modules/'],
  },

  // Global settings
  {
    languageOptions: {
      ecmaVersion: 2022,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        // FiveM NUI globals
        GetParentResourceName: 'readonly',
        SetConvar: 'readonly',
        fetch: 'readonly',
        window: 'readonly',
      },
    },
  },

  // React Hooks rules
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Accessibility rules
  {
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Relax some rules that don't apply to fullscreen game UIs
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'warn',
    },
  },

  // Custom NUI rules
  {
    plugins: {
      nui: nuiPlugin,
    },
    rules: {
      'nui/no-inline-styles': 'error',
      'nui/no-plugin-internals': 'error',
    },
  },

  // Tailwind CSS rules
  {
    plugins: {
      tailwindcss,
    },
    settings: {
      tailwindcss: {
        cssConfigPath: './src/styles/index.css',
      },
    },
    rules: {
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/classnames-order': 'warn',
    },
  },

  // Project-specific rules
  {
    rules: {
      // TypeScript strictness
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      '@typescript-eslint/consistent-type-imports': 'error',

      // React best practices
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',

      // Code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-inner-declarations': 'error',

      // Style
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
)
