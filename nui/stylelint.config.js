/** @type {import("stylelint").Config} */
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['dist/**/*.css'],
  rules: {
    // -- CEF compatibility: keep vendor prefixes and rgba() --
    'property-no-vendor-prefix': null,
    'color-function-alias-notation': null,
    'color-function-notation': null,
    'alpha-value-notation': null,

    // -- Import syntax: bare strings work fine with Vite --
    'import-notation': null,

    // -- Naming: project uses consistent kebab-case and BEM modifiers --
    'selector-class-pattern': null,
    'keyframes-name-pattern': null,

    // -- Layout: allow multi-declaration blocks --
    'declaration-block-single-line-max-declarations': null,

    // -- Media features --
    'media-feature-range-notation': null,

    // -- Duplicate custom properties (intentional override in .redm) --
    'declaration-block-no-duplicate-custom-properties': null,
  },
};
