module.exports = {
  parser: '@typescript-eslint/parser', // TypeScript парсер
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true, // enable JSX
    },
  },
  env: {
    browser: true,
    es2021: true,
  },
  settings: {
    react: {
      version: 'detect', // автоматично открива инсталираната версия на React
    },
  },
  plugins: ['react', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended', // React правила
    'plugin:@typescript-eslint/recommended', // TypeScript правила
  ],
  rules: {
    // тук можеш да добавиш свои правила
    'react/jsx-uses-react': 'off', // ако използваш React 17+ с новия JSX трансформ
    'react/react-in-jsx-scope': 'off', // React 17+ не изисква import React
  },
  overrides: [
    {
      files: [
        '*.cjs',
        '.eslintrc.js',
        'postcss.config.cjs',
        'prettier.config.cjs',
      ],
      parserOptions: {
        sourceType: 'commonjs',
      },
      env: {
        node: true,
        commonjs: true,
      },
    },
  ],
};
