import type { Text } from "@codemirror/state";
import type { Diagnostic } from "@codemirror/lint";
import type { LintIssue } from "../../src/lint-profile";

export interface DiagnosticMapping extends Diagnostic {
  fallback: "exact" | "line";
}

export function lintDiagnostic(document: Text, issue: LintIssue): DiagnosticMapping {
  const lineNumber = Math.max(1, Math.min(issue.line, document.lines));
  const line = document.line(lineNumber);
  const hasExactRange = issue.column !== null && issue.length !== null;
  let from = line.from;
  let to = line.to;
  if (hasExactRange) {
    from = Math.min(line.to, line.from + Math.max(0, issue.column! - 1));
    to = Math.min(line.to, from + Math.max(0, issue.length!));
  }
  // CodeMirror can display a point diagnostic, but a visible character range
  // is preferable when a nonempty logical line is the only known location.
  if (to === from && line.to > line.from) to = Math.min(line.to, from + 1);
  return {
    from,
    to,
    severity: "warning",
    source: issue.rule,
    message: [issue.message, issue.detail].filter(Boolean).join(" — "),
    markClass: hasExactRange ? "qm-diagnostic-exact" : "qm-diagnostic-line",
    fallback: hasExactRange ? "exact" : "line",
  };
}

export function lintDiagnostics(document: Text, issues: readonly LintIssue[]): Diagnostic[] {
  return issues.map(issue => lintDiagnostic(document, issue));
}
