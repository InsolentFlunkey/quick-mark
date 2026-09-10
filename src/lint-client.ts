import type { RuleOverrides } from "./lint-rules";
import type { LintIssue } from "./lint-profile";

export interface LintWorker {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage(value: unknown): void;
  terminate(): void;
}

export class LintClient {
  private serial = 0;
  private stop: ((reason: string) => void) | null = null;
  constructor(private factory: () => LintWorker = () => new Worker(new URL("./lint.worker.ts", import.meta.url), { type: "module" }),
    private timeout = 10_000) {}
  cancel(reason = "Linting canceled.") { this.stop?.(reason); }
  run(source: string, overrides: RuleOverrides = {}): Promise<LintIssue[]> {
    this.cancel();
    const requestId = ++this.serial;
    return new Promise((resolve, reject) => {
      let worker: LintWorker;
      try { worker = this.factory(); } catch (error) { reject(error); return; }
      let settled = false;
      const finish = (error?: string, issues?: LintIssue[]) => {
        if (settled) return;
        settled = true; clearTimeout(timer); worker.terminate(); this.stop = null;
        if (error) reject(new Error(error)); else resolve(issues!);
      };
      const timer = setTimeout(() => finish("Linting timed out after 10 seconds."), this.timeout);
      this.stop = reason => finish(reason);
      worker.onmessage = event => {
        if (event.data?.requestId !== requestId) return;
        if (typeof event.data.error === "string") finish(event.data.error);
        else if (Array.isArray(event.data.issues)) finish(undefined, event.data.issues);
        else finish("Invalid lint worker response.");
      };
      worker.onerror = () => finish("Could not run the lint worker.");
      worker.onmessageerror = () => finish("Could not read lint worker results.");
      try { worker.postMessage({ requestId, source, overrides }); } catch (error) { finish(String(error)); }
    });
  }
}
