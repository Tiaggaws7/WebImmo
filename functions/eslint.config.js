// functions/eslint.config.js
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginJs from "@eslint/js";

export default [
  // Base ESLint recommended rules
  pluginJs.configs.recommended,

  // TypeScript specific rules
  ...tseslint.configs.recommended,

  // Configuration for all files
  {
    languageOptions: {
      globals: {
        ...globals.node, // Enables Node.js global variables
      },
      parser: tseslint.parser, // Specifies the TypeScript parser
    },
    rules: {
      // Add or override rules here. For example:
      "quotes": ["error", "double"],
      "import/no-unresolved": 0, // Turn off for now if you have path issues

      // This explicitly configures the rule that was failing, which is good practice
      "@typescript-eslint/no-unused-expressions": ["error", { 
        "allowShortCircuit": true, 
        "allowTernary": true 
      }],
    },
  },

  // Ignore build output and node_modules
  {
    ignores: ["lib/", "node_modules/"],
  },
];