import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "DormanLakelyLegendaryActions",
      fileName: () => "main.js",
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        dir: "dist",
        entryFileNames: "main.js",
        inlineDynamicImports: true,
      },
    },
    target: "es2022",
    minify: false,
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["tests/setup.ts"],
  },
});
