import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: resolve(here),
  base: "./",
  build: {
    outDir: resolve(here, "../../dist-codemirror"),
    emptyOutDir: true,
    rollupOptions: { input: resolve(here, "index.html") },
  },
  server: { port: 1422, strictPort: true },
});
