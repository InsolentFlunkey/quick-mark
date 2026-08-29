import { defineConfig } from "vite";
import { resolve } from "node:path";

// Tauri sets this host when exposing the development server to a device.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  clearScreen: false,
  publicDir: "shared",
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
