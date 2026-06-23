import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'design/**',
      'docs/**/*.html',
      '**/*.html',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Arrow no-ops são idiomáticos como callbacks de placeholder.
      '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],
    },
  },

  // React: regras CLÁSSICAS de hooks + Fast Refresh (Vite). Não habilitamos as
  // regras novas do React Compiler (static-components, set-state-in-effect, ...)
  // porque o projeto não usa o compiler — elas forçariam refactors sem ganho aqui.
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Acessibilidade no código de UI.
  { ...jsxA11y.flatConfigs.recommended, files: ['src/**/*.{ts,tsx}'] },

  // import-x: ordenação, sem ciclos, sem duplicatas.
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    settings: {
      'import-x/resolver': { typescript: { project: './tsconfig.app.json' }, node: true },
    },
    rules: {
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
    },
  },

  // Disciplina de ambiente: `import.meta.env` só em src/lib/env.ts.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/env.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.type='MetaProperty'][property.name='env']",
          message: "Importe `env` de 'src/lib/env' em vez de ler import.meta.env direto.",
        },
      ],
    },
  },

  // Vitest para os testes; Testing Library para componentes.
  { files: ['src/**/*.{test,spec}.{ts,tsx}'], ...vitest.configs.recommended },
  { files: ['src/**/*.test.tsx'], ...testingLibrary.configs['flat/react'] },

  // JS puro (configs): sem regras type-aware.
  { files: ['**/*.{js,mjs,cjs}'], extends: [tseslint.configs.disableTypeChecked] },

  // Prettier por último: desliga regras de formatação conflitantes.
  prettier,
);
