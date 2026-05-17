import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextCoreWebVitals,
  {
    ignores: ["public/**"],
  },
  {
    rules: {
      "@next/next/no-server-import-in-page": "off",

      // TODO(next16-react-hooks): Re-enable these rules after the existing
      // violations are fixed. They are disabled to preserve pre-migration lint
      // behavior during the Next.js 16 upgrade.
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",

      "react/no-unknown-property": [
        1,
        {
          ignore: [
            "metalness",
            "position",
            "transparent",
            "attach",
            "intensity",
            "lookAt",
            "args",
            "rotation",
            "roughness",
            "map",
            "reflectivity",
            "object",
          ],
        },
      ],
    },
  },
]);
