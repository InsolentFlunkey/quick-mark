import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(path, "utf8");

describe("rendered-code copy feedback wiring", () => {
  it("uses the established main status area and an equivalent reference live region", () => {
    const mainMarkup = source("index.html");
    expect(mainMarkup).toContain('class="operation-status"');
    expect(mainMarkup).toContain('id="operation-status"');
    expect(mainMarkup).not.toContain('id="copy-status"');

    const referenceMarkup = source("reference.html");
    expect(referenceMarkup).toContain('class="copy-status"');
    expect(referenceMarkup).toContain('id="copy-status"');
    expect(referenceMarkup).toContain('role="status"');
    expect(referenceMarkup).toContain('aria-live="polite"');
  });

  it("uses the standard transient interval and controller in every application entry point", () => {
    const main = source("src/main.ts");
    expect(main).toContain('operationStatusController.show({ status: "success", message })');
    expect(main).toContain("OPERATION_TRANSIENT_DURATION_MS");

    const reference = source("src/reference.ts");
    expect(reference).toContain("createOperationStatusController(copyStatus, null)");
    expect(reference).toContain('copyStatusController.show({ status: "success", message })');
    expect(reference).toContain("OPERATION_TRANSIENT_DURATION_MS");
  });

  it("styles copied buttons and hides empty or printed copy messages", () => {
    const markdownStyles = source("shared/markdown.css");
    const applicationStyles = source("src/styles.css");

    expect(markdownStyles).toContain('.copy-btn[data-copy-state="copied"]');
    expect(applicationStyles).toMatch(/\.copy-status\s*{[^}]*top:\s*1rem;/s);
    expect(applicationStyles).toContain(".copy-status:empty { display: none; }");
    expect(applicationStyles).toContain(".copy-status { display: none !important; }");
  });
});
