import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "Use the cryptographic RandomSource layer instead.",
        },
      ],
    },
  },
);
