/**
 * Custom ESLint rules for the EasyAdmin NUI project.
 *
 * Rules:
 * - no-inline-styles: Prohibit style={{}} in JSX (use CSS classes/tokens)
 * - require-token: Ensure CSS values reference design tokens (stub — see scripts/check-tokens.mjs)
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

export default {
  rules: {
    'no-inline-styles': noInlineStyles,
    'require-token': requireToken,
  },
}
