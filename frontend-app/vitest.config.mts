import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Le pool "forks" n'arrive pas à démarrer ses workers depuis un chemin OneDrive
    // contenant espaces et apostrophes ; "threads" fonctionne sur les mêmes tests.
    pool: "threads",
  },
});
