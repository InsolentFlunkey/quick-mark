import { lintSource } from "./lint-profile";

self.onmessage = (event: MessageEvent<{ requestId: number; source: string }>) => {
  const { requestId, source } = event.data;
  try {
    self.postMessage({ requestId, issues: lintSource(source) });
  } catch (error) {
    self.postMessage({ requestId, error: String(error) });
  }
};
