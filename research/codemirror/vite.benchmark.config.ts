import { defineConfig, mergeConfig } from "vite";
import base from "./vite.config";

export default mergeConfig(base, defineConfig({
  plugins: [{
    name: "quickmark-codemirror-benchmark",
    transform(code, id) {
      if (!id.replaceAll("\\", "/").endsWith("/research/codemirror/index.ts")) return;
      // Dynamic import runs after index.ts initializes the research API. A
      // static import would be hoisted and start the harness too early.
      return `${code}\nvoid import("./native-benchmark");`;
    },
  }],
}));
