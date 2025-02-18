import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
})

export default [...compat.extends('eslint:recommended'), {
	languageOptions: {
		globals: {
			...globals.browser,
			...globals.commonjs,
		},

		ecmaVersion: 'latest',
		sourceType: 'module',
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
}]
