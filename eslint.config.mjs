import nextPlugin from '@next/eslint-plugin-next';
export default [
  { ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**', 'attached_assets/**'] },
  { files: ['**/*.{js,jsx,cjs,mjs}'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } }, plugins: { '@next/next': nextPlugin }, rules: { '@next/next/no-async-client-component': 'error', 'no-dupe-args': 'error', 'no-dupe-keys': 'error', 'no-duplicate-case': 'error', 'no-unreachable': 'error', 'valid-typeof': 'error', 'constructor-super': 'error' } },
];
