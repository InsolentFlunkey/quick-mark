import type { RuleOverrides } from "./lint-rules";
import { lintSource } from "./lint-profile";

self.onmessage = (event: MessageEvent<{ requestId: number; source: string; overrides?: RuleOverrides }>) => {
  const { requestId, source, overrides } = event.data;
  try {
    self.postMessage({ requestId, issues: lintSource(source, overrides) });
  } catch (error) {
    self.postMessage({ requestId, error: String(error) });
  }
};
