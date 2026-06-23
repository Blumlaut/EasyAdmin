/**
 * Custom ESLint rules for the EasyAdmin NUI project.
 *
 * Rules:
 * - no-inline-styles: Prohibit style={{}} in JSX (use CSS classes/tokens)
 * - require-token: Ensure CSS values reference design tokens (stub — see scripts/check-tokens.mjs)
 * - no-plugin-internals: Prevent plugin packages from importing private EasyAdmin internals
 */

/**
 * Disallow inline style={{}} in JSX elements.
 *
 * Rationale: All styling must use CSS classes referencing design tokens.
 * Inline styles bypass the token system and create tech debt.
 *
 * Exceptions: Add `// eslint-disable-next-line nui/no-inline-styles -- <reason>`
 * for truly dynamic values that cannot be pre-styled.
 */
const noInlineStyles = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow inline style props in JSX',
      recommended: true,
    },
    schema: [],
    messages: {
      noInlineStyle:
        'Inline styles are prohibited. Use CSS classes with design tokens instead.',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (
          node.name?.name === 'style' &&
          node.value?.type === 'JSXExpressionContainer' &&
          node.value.expression?.type === 'ObjectExpression'
        ) {
          context.report({
            node,
            messageId: 'noInlineStyle',
          })
        }
      },
    }
  },
}

/**
 * Require CSS custom property references (var(--token)) in style rules.
 *
 * Scans .css files and flags raw color/spacing values outside :root.
 * Allowlisted patterns: calc(), url(), standard keywords (transparent, inherit, etc.)
 */
const requireToken = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require design token references in CSS values',
      recommended: false,
    },
    schema: [],
    messages: {
      noToken: 'CSS value should use a design token (var(--...)) instead of a raw value.',
    },
  },
  create(_context) {
    // This rule is implemented as a post-build check script rather than
    // an AST rule, since standard ESLint doesn't parse CSS natively.
    // See scripts/check-tokens.mjs for the implementation.
    return {}
  },
}

/**
 * Prevent plugin packages from importing private EasyAdmin internals.
 *
 * Plugins (files under `src/plugins/<package>/`) must only use the public
 * plugin SDK surface plus reusable, non-stateful shared modules (components,
 * types, fivem, lib). Importing the app's private stateful hooks/contexts
 * (useAppData, useAppNavigation, App, ModalContext, etc.) couples plugins
 * to internals that may change and breaks the plugin contract.
 *
 * Allowed import sources from a plugin package:
 *   - The SDK barrel: `../` or `../index`, `../types`, `../api`, etc.
 *   - Sibling plugin files: `./...`
 *   - React / third-party packages
 *   - `../../fivem`, `../../types`, `../../lib/*`, `../../components/*`,
 *     `../../styles/*`, `../../hooks/*` (excluding the private hooks below)
 *
 * Blocked (private, stateful internals):
 *   - ../../App
 *   - ../../ModalContext
 *   - ../../hooks/useAppData
 *   - ../../hooks/useAppNavigation
 *   - ../../hooks/useWindowChrome
 *   - ../../modals/ModalBuilder
 */
const noPluginInternals = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow plugin packages from importing private EasyAdmin internals',
      recommended: true,
    },
    schema: [],
    messages: {
      noInternals:
        'Plugin packages must not import private EasyAdmin internals ({{source}}). ' +
        'Use the plugin SDK (`../index`) and the public API instead. ' +
        'See docs/nui-plugins.md.',
    },
  },
  create(context) {
    const filename = context.filename || ''

    // Only apply to files inside a plugin package directory:
    //   src/plugins/<package-name>/<file>
    // The SDK files live directly in src/plugins/ and are exempt.
    const pluginsIdx = filename.lastIndexOf('/plugins/')
    if (pluginsIdx === -1) return {}
    const afterPlugins = filename.slice(pluginsIdx + '/plugins/'.length)
    // Must contain at least one path separator (i.e. be inside a subdirectory).
    if (!afterPlugins.includes('/')) return {}

    // Private internal modules plugins must not touch.
    const BLOCKED = [
      /(^|\/)App(\.tsx?)?$/,
      /ModalContext(\.tsx?)?$/,
      /hooks\/useAppData(\.ts)?$/,
      /hooks\/useAppNavigation(\.ts)?$/,
      /hooks\/useWindowChrome(\.ts)?$/,
      /hooks\/useAppNavigation(\.ts)?$/,
      /modals\/ModalBuilder(\.tsx?)?$/,
    ]

    function isBlocked(source) {
      return BLOCKED.some((re) => re.test(source))
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (typeof source !== 'string') return
        if (isBlocked(source)) {
          context.report({
            node: node.source,
            messageId: 'noInternals',
            data: { source },
          })
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source && typeof node.source.value === 'string' && isBlocked(node.source.value)) {
          context.report({
            node: node.source,
            messageId: 'noInternals',
            data: { source: node.source.value },
          })
        }
      },
      ExportAllDeclaration(node) {
        if (node.source && typeof node.source.value === 'string' && isBlocked(node.source.value)) {
          context.report({
            node: node.source,
            messageId: 'noInternals',
            data: { source: node.source.value },
          })
        }
      },
    }
  },
}

export default {
  rules: {
    'no-inline-styles': noInlineStyles,
    'require-token': requireToken,
    'no-plugin-internals': noPluginInternals,
  },
}
