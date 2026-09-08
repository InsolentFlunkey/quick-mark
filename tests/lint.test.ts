import { afterEach, describe, expect, it, vi } from "vitest";
import { lintSource, LINT_PROFILE } from "../src/lint-profile";
import { LintClient, type LintWorker } from "../src/lint-client";
import { cloneLintState, nearestIssue, PROFILE_VERSION, sourceRange } from "../src/lint-state";
import { DocumentWorkspace } from "../src/document-workspace";

describe("approved lint profile", () => {
  it("enables formatting checks and only excludes the approved active rules", () => {
    expect(Object.keys(LINT_PROFILE).filter(key => /^MD/.test(key))).toHaveLength(51);
    const rules = lintSource("# Title\n# Second\n- item\n\nhttps://example.com\n\n[Section](#missing)\n").map(issue => issue.rule);
    expect(rules).toContain("MD025"); expect(rules).toContain("MD022");
    expect(rules).not.toContain("MD034"); expect(rules).not.toContain("MD051");
  });
  it("reports clean content and does not honor inline disabling", () => {
    expect(lintSource("# Title\n\nA paragraph.\n")).toEqual([]);
    expect(lintSource("# Title\n\n<!-- markdownlint-disable -->\n\n# Other\n").map(x => x.rule)).toContain("MD025");
  });
  it("reports useful ranges and context without executing HTML", () => {
    const issue = lintSource("# Title\n\n[text]()\n").find(x => x.rule === "MD042")!;
    expect(issue.line).toBe(3); expect(issue.column).toBeGreaterThan(0);
    expect(lintSource("# Title\n\n<script>alert(1)</script>\n").some(x => x.rule === "MD033")).toBe(true);
  });
});

const issue = { rule: "MD042", message: "Empty link", line: 2, column: 4, length: 3, detail: "", context: "" };
describe("lint snapshot safety", () => {
  it("maps UTF-16/CRLF source positions and clamps malformed ranges", () => {
    expect(sourceRange("first\r\n😀 [x]()\r\n", issue)).toEqual({ start: 10, end: 13 });
    expect(sourceRange("a", { ...issue, line: 999, column: 999 })).toEqual({ start: 1, end: 1 });
  });
  it("handles sparse, repeated and absent issue lines", () => {
    const rows = [1,10,10,100].map(line => ({ ...issue, line }));
    expect(nearestIssue(rows,10)).toBe(1); expect(nearestIssue(rows,55)).toBe(1);
    expect(nearestIssue([],5)).toBe(-1);
  });
  it("preserves completed transfer results and invalidates edits", () => {
    const source = new DocumentWorkspace(() => "one"); const id = source.create();
    source.setView(id, { ...source.view(id), lint: { profile: PROFILE_VERSION, source: "", status: "complete",
      issues: [issue], error: "", inspecting: true, pane: "results", selected: 0, visible: 200, resultsScroll: 0 } });
    const transfer = source.beginTransfer(id); const destination = new DocumentWorkspace();
    destination.adopt(transfer.state); transfer.acknowledge();
    expect(destination.view(id).lint?.issues).toEqual([issue]);
    destination.edit(id,"changed"); expect(destination.view(id).lint?.status).toBe("stale");
    expect(() => cloneLintState({ ...destination.view(id).lint!, issues: [{ ...issue, line: -1 }] })).toThrow();
  });
});

describe("worker lifecycle", () => {
  afterEach(() => vi.useRealTimers());
  function fixture(timeout = 10000) {
    const workers: LintWorker[] = [];
    const client = new LintClient(() => {
      const worker = { onmessage: null, onerror: null, onmessageerror: null, postMessage: vi.fn(), terminate: vi.fn() };
      workers.push(worker); return worker;
    }, timeout);
    return { client, workers };
  }
  it("rejects canceled jobs and ignores late responses", async () => {
    const { client, workers } = fixture();
    const first = client.run("old"); const rejection = expect(first).rejects.toThrow("canceled");
    const second = client.run("new"); await rejection;
    workers[0].onmessage!({ data: { requestId: 1, issues: [issue] } } as MessageEvent);
    workers[1].onmessage!({ data: { requestId: 2, issues: [] } } as MessageEvent);
    expect(await second).toEqual([]); expect(workers[0].terminate).toHaveBeenCalledOnce();
  });
  it("terminates timed-out workers and can retry", async () => {
    vi.useFakeTimers(); const { client, workers } = fixture(10);
    const pending = client.run("text"); const rejection = expect(pending).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(10); await rejection;
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    const next = client.run("retry"); workers[1].onerror!({} as ErrorEvent);
    await expect(next).rejects.toThrow("worker");
  });
});
