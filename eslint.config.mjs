import tseslint from "typescript-eslint";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  eslintJs.configs.recommended,
  ...tseslint.config(
    {
      files: ["**/*.ts", "**/*.tsx"],
      extends: [
        tseslint.configs.strict,
        tseslint.configs.strictTypeChecked,
        tseslint.configs.stylistic,
        tseslint.configs.stylisticTypeChecked,
      ],
      languageOptions: {
        parserOptions: {
          ecmaVersion: 2022,
          sourceType: "module",
          project: true,
          tsconfigRootDir: import.meta.dirname,
        },
        globals: {
          console: "readonly",
          Buffer: "readonly",
          require: "readonly",
          process: "readonly",
          __dirname: "readonly",
          __filename: "readonly",
          module: "readonly",
          exports: "readonly",
        },
      },
      rules: {
        "@typescript-eslint/member-ordering": "warn",
        "@typescript-eslint/explicit-member-accessibility": [
          "error",
          {
            accessibility: "explicit",
            overrides: {
              accessors: "explicit",
              constructors: "no-public",
              methods: "explicit",
              properties: "explicit",
              parameterProperties: "explicit",
            },
          },
        ],
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/naming-convention": [
          "error",
          {
            selector: "default",
            format: ["camelCase"],
            leadingUnderscore: "allow",
          },
          {
            selector: "import",
            format: ["camelCase", "PascalCase"],
          },
          {
            selector: "variable",
            format: ["camelCase"],
            leadingUnderscore: "allow",
            trailingUnderscore: "allow",
          },
          {
            selector: "variable",
            modifiers: ["const", "global"],
            types: ["boolean", "number", "string"],
            format: ["UPPER_CASE"],
          },
          {
            selector: "variable",
            modifiers: ["const", "global", "exported"],
            types: ["boolean", "number", "string", "array", "function"],
            format: ["camelCase"],
          },
          {
            selector: "variable",
            modifiers: ["const", "global", "exported"],
            format: ["camelCase", "PascalCase"],
          },
          {
            selector: "property",
            modifiers: ["requiresQuotes"],
            format: null,
          },
          {
            selector: "property",
            modifiers: ["static", "readonly"],
            types: ["boolean", "number", "string"],
            format: ["UPPER_CASE"],
          },
          {
            selector: "typeLike",
            format: ["PascalCase"],
          },
          {
            selector: "objectLiteralProperty",
            format: null,
          },
          {
            selector: "enumMember",
            format: ["UPPER_CASE"],
          },
          {
            selector: "typeProperty",
            format: ["camelCase", "snake_case", "UPPER_CASE"],
          },
          {
            selector: "function",
            modifiers: ["exported"],
            format: ["camelCase", "PascalCase"],
          },
        ],
      },
    },
    {
      extends: [eslintPluginPrettierRecommended, eslintConfigPrettier],
      rules: {
        "prettier/prettier": [
          "error",
          {
            singleQuote: true,
            semi: false,
          },
        ],
      },
    }
  ),
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    rules: {
      complexity: ["error"],
      curly: ["error", "multi-or-nest", "consistent"],
      "dot-notation": "error",
      eqeqeq: ["error", "smart"],
      "no-new": "error",
      "no-new-wrappers": "error",
      "no-param-reassign": "error",
      "no-throw-literal": "error",
      "func-style": ["warn", "declaration"],
      "no-restricted-imports": [
        "error",
        {
          patterns: ["./", "../", "~/"],
        },
      ],
    },
  },
  // jsdoc.configs['flat/recommended'],
  // {
  //   files: ['**/*.ts'],
  //   plugins: {
  //     jsdoc,
  //   },
  //   rules: {
  //     'jsdoc/require-description': 'warn'
  //   }
  // },
  {
    ignores: ["dist/", "node_modules/", "*.config.mjs", "*.config.js","tests/**/*.test.ts"],
  },
];
