import { ruleConfigurationKey, LINT_RULES } from "./lint-rules";
import type { LintIssue } from "./lint-profile";

export const PROFILE_VERSION = "quickmark-1-markdownlint-0.41.1";
export interface LintState {
  profile: string;
  configuration?: string;
  source: string;
  status: "running" | "complete" | "stale" | "failed" | "canceled";
  issues: LintIssue[];
  error: string;
  inspecting: boolean;
  pane: "results" | "preview";
  selected: number;
  visible: number;
  resultsScroll: number;
}

export function cloneLintState(value: LintState): LintState {
  if (!value || value.profile !== PROFILE_VERSION || typeof value.source !== "string" ||
    !["running", "complete", "stale", "failed", "canceled"].includes(value.status) ||
    typeof value.error !== "string" || typeof value.inspecting !== "boolean" ||
    !["results", "preview"].includes(value.pane) ||
    ![value.selected, value.visible, value.resultsScroll].every(n => Number.isFinite(n) && n >= 0) ||
    !Number.isInteger(value.selected) || !Number.isInteger(value.visible) ||
    !Array.isArray(value.issues)) throw new Error("Invalid lint state");
  if (value.configuration !== undefined && (typeof value.configuration !== "string" ||
    value.configuration.length !== LINT_RULES.length || /[^01]/.test(value.configuration))) throw new Error("Invalid lint configuration identity");
  const issues = value.issues.map(issue => {
    if (!issue || ![issue.rule, issue.message, issue.detail, issue.context].every(s => typeof s === "string") ||
      !Number.isInteger(issue.line) || issue.line < 1 ||
      (issue.column !== null && (!Number.isInteger(issue.column) || issue.column < 1)) ||
      (issue.length !== null && (!Number.isInteger(issue.length) || issue.length < 0))) throw new Error("Invalid lint issue");
    return { ...issue };
  });
  return { ...value, configuration: value.configuration ?? ruleConfigurationKey(), issues };
}

export function sourceRange(source: string, issue: LintIssue) {
  const lines = source.split("\n");
  const line = Math.min(lines.length, Math.max(1, issue.line)) - 1;
  let offset = 0;
  for (let i = 0; i < line; i++) offset += lines[i].length + 1;
  const length = lines[line].replace(/\r$/, "").length;
  const start = offset + Math.min(length, Math.max(0, (issue.column ?? 1) - 1));
  return { start, end: Math.min(offset + length, start + (issue.length ?? 0)) };
}

export function nearestIssue(issues: readonly LintIssue[], line: number): number {
  if (!issues.length) return -1;
  let best = 0;
  for (let i = 1; i < issues.length; i++) {
    if (Math.abs(issues[i].line - line) < Math.abs(issues[best].line - line)) best = i;
  }
  return best;
}
