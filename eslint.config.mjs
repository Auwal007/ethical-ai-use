import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "backend/.venv/**",
      "backend/staticfiles/**",
      "backend/**/__pycache__/**",
    ],
  },
  {
    extends: [...next],
  },
]);
