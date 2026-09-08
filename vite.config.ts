import { defineConfig } from "vite";
import { resolve } from "node:path";
import { loadAppMetadata } from "./build/app-metadata";

// Tauri sets this host when exposing the development server to a device.
const host = process.env.TAURI_DEV_HOST;
const appMetadata = loadAppMetadata(resolve(process.cwd(), "src-tauri/tauri.conf.json"));

export default defineConfig({
  clearScreen: false,
  define: {
    __QUICKMARK_METADATA__: JSON.stringify(appMetadata),
  },
  publicDir: "shared",
  // Prefer DOM-free package exports in both development and worker builds.
  // markdownlint's entity decoder otherwise selects a document-dependent export.
  resolve: { conditions: ["worker", "module", "browser", "development|production"] },
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), "index.html"),
        reference: resolve(process.cwd(), "reference.html"),
      },
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
