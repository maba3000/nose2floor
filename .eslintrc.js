module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // must be last — disables formatting rules that conflict with Prettier
  ],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  ignorePatterns: ['node_modules/', 'dist/', 'dist-web/', '.expo/'],
  overrides: [
    {
      // CommonJS config files and files with unavoidable dynamic require
      files: ['*.cjs', 'metro.config.js', 'babel.config.js', 'src/persistence/storage.ts'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
