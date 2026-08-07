import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
// NOTE: typescript-eslint is disabled until it supports TypeScript 7 (tsgo).
// The parser (@typescript-eslint/parser) depends on typescript-estree which
// accesses ts.Extension at module load time — this symbol was removed in TS 7
// (the Go-native port), so the entire package crashes on import.
//
// To re-enable when typescript-eslint adds TS 7 support:
//   1. Uncomment the import below
//   2. Replace the plain array export with tseslint.config(...)
//   3. Add ...tseslint.configs.recommended and ...tseslint.configs.strict
//   4. Add parser: '@typescript-eslint/parser' to languageOptions
//   5. Uncomment the @typescript-eslint/* rules in the rules section below
// import tseslint from 'typescript-eslint'
import tailwindcss from 'eslint-plugin-tailwindcss'
import nuiPlugin from './eslint-plugin-nui.mjs'

export default [
  {
    ignores: ['dist/', 'node_modules/'],
  },

  // Base + plugin configs apply to JS files only until typescript-eslint supports TS 7.
  // TypeScript files are validated via `tsc --noEmit` (npm run typecheck) instead.
  {
    files: ['**/*.{js,jsx,mjs}'],
    ...js.configs.recommended,
  },

  // Global settings
  {
    // NOTE: parser: '@typescript-eslint/parser' must be added when re-enabling
    // typescript-eslint. Without it, ESLint cannot parse .ts/.tsx files.
    files: ['**/*.{js,jsx,mjs}'],
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
    files: ['**/*.{js,jsx,mjs}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Accessibility rules
  {
    files: ['**/*.{js,jsx,mjs}'],
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
    files: ['**/*.{js,jsx,mjs}'],
    plugins: {
      nui: nuiPlugin,
    },
    rules: {
      'nui/no-inline-styles': 'error',
    },
  },

  // Tailwind CSS rules
  {
    files: ['**/*.{js,jsx,mjs}'],
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
    files: ['**/*.{js,jsx,mjs}'],
    rules: {
      // TypeScript strictness — re-enable when typescript-eslint supports TS 7:
      // '@typescript-eslint/no-explicit-any': 'error',
      // '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // '@typescript-eslint/consistent-type-imports': 'error',

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
]
