import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jest from 'eslint-plugin-jest';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.jsx', 'src/*.jsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    rules: {
      // Add or override rules here if needed
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/*.test.jsx'],
    plugins: { jest },
    rules: {
      ...jest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        jest: true,
      },
    },
  },
  {
    ignores: ['babel.config.cjs'],
  },
]; 