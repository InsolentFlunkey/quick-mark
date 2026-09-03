import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("operation status wiring", () => {
  it("routes main-window outcomes and edits through the status controller", () => {
    const main = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");

    expect(main).toContain("createOperationStatusController(operationStatus, dismissOperationStatusButton)");
    expect(main).toContain("operationStatusController.show(outcome)");
    expect(main).toContain("operationStatusController.dismissTransient()");
    expect(main).not.toContain("operationStatus.textContent");

    const markup = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(markup).toContain('id="dismiss-operation-status"');
    expect(markup).toContain(">Dismiss</button>");
  });
});
