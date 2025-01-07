import { fixupConfigRules } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "**/rpc",
        "**/api",
        "**/assets",
        "**/cluster-services",
        "**/fonts",
        "**/node_modules",
        "**/.d.ts",
        "**/.pb.ts",
        "**/setupProxy.js",
        "**/test-utils.tsx",
        "**/reportWebVitals.ts",
        "**/*.mjs"
    ],
}, ...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/typescript",
    "plugin:import/warnings",
    "plugin:jest/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react/recommended",
    "plugin:testing-library/react",
)), {
    languageOptions: {
        ecmaVersion: 5,
        sourceType: "script",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    settings: {
        react: {
            version: "detect",
        },
    },

    rules: {
        "import/default": [0],
        "import/no-named-as-default-member": [0],
        "import/no-named-as-default": [0],
        "import/no-unresolved": [0],

        "import/order": [2, {
            alphabetize: {
                order: "asc",
                caseInsensitive: true,
            },

            groups: [
                "builtin",
                "external",
                "internal",
                "parent",
                "sibling",
                "index",
                "object",
                "type",
            ],
        }],

        "@typescript-eslint/explicit-module-boundary-types": [0],
        "@typescript-eslint/no-unused-vars": [0],


        "@typescript-eslint/no-explicit-any": [0],
        "@typescript-eslint/ban-ts-comment": [0],
        "@typescript-eslint/switch-exhaustiveness-check": [0],
        "@typescript-eslint/no-non-null-assertion": [0],
        "testing-library/no-node-access": [0],
        "testing-library/no-unnecessary-act": [0],
        "testing-library/render-result-naming-convention": [0],
        "testing-library/prefer-screen-queries": [0],
        "jest/expect-expect": [0],
        "react/react-in-jsx-scope": [0],
        "react/jsx-uses-react": [0],
        "react/no-unescaped-entities": [0],
        "react/jsx-key": [0],
        "jsx-a11y/label-has-associated-control": [0],
        "jsx-a11y/click-events-have-key-events": [0],
        "jsx-a11y/no-static-element-interactions": [0],
        "jsx-a11y/no-autofocus": [0],
    },
}];