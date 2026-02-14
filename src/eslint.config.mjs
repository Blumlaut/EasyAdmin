import globals from 'globals'
import js from '@eslint/js'
export default [
	js.configs.recommended,
	{
		rules: {
			complexity: ['error', { max: 10 }],
		},
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.commonjs,
			},

			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},

		rules: {
			indent: ['error', 'tab'],
			'linebreak-style': ['error', 'unix'],
			quotes: ['error', 'single'],
			semi: ['error', 'never'],
			'no-undef': 'off',
			'no-unused-vars': 'warn',
			'no-else-return': ['warn'],

			'no-empty-function': ['error', {
				allow: ['arrowFunctions'],
			}],

			'no-implicit-coercion': ['warn'],
			'no-useless-return': ['warn'],
			'no-undef-init': ['warn'],
		},
	}
]
