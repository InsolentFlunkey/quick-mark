import { defineConfig, mergeConfig } from "vite";
import base from "../../vite.config";

// This transform only exists in the opt-in benchmark build. No production hooks.
export default mergeConfig(base, defineConfig({
  build: { outDir: "dist-benchmark", emptyOutDir: false },
  plugins: [{ name: "quickmark-benchmark", transform(code, id) {
    if (!id.replaceAll("\\", "/").endsWith("/src/main.ts")) return;
    return code + `\nimport { runBenchmark } from "../research/performance/native";
      void runBenchmark({
        ready: () => !tabSession.busy && applicationMenu !== null,
        setView: (mode, syncScrolling) => updateViewPreferences({mode, syncScrolling, swapped:false}),
        refresh: () => scrollSync?.refresh(),
        exitLint: () => lintResults?.exit(),
      });`;
  } }],
}));
