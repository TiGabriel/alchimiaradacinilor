import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Layering (see CLAUDE.md): app → features → services → lib.
// Services and lib must stay free of UI code; UI primitives must not fetch data.
const noUiInServerLayers = {
  patterns: [
    {
      group: ["@/app/*", "@/features/*", "@/components/*"],
      message: "services/lib must not import UI layers.",
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  {
    files: ["src/services/**", "src/lib/**", "src/validation/**"],
    rules: { "no-restricted-imports": ["error", noUiInServerLayers] },
  },
  {
    files: ["src/components/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/services/*", "@/lib/db", "@/features/*"],
              message: "UI primitives must stay presentational.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
