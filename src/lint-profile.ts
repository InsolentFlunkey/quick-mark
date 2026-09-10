import { LINT_RULES, ruleEnabled, validateOverrides, type RuleOverrides } from "./lint-rules";
import type { Configuration } from "markdownlint";
import { lint } from "markdownlint/sync";

export const LINT_PROFILE_VERSION = "quickmark-1-markdownlint-0.41.1";
const ruleIds = [1,3,4,5,7,9,10,11,12,13,14,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,52,53,54,55,56,58,59,60];
export const LINT_PROFILE: Configuration = Object.freeze({
  default: false,
  ...Object.fromEntries(ruleIds.map(id => [`MD${String(id).padStart(3, "0")}`, true])),
  MD025: { level: 1, front_matter_title: "" },
  MD041: { level: 1, front_matter_title: "" },
});

export interface LintIssue {
  rule: string;
  message: string;
  line: number;
  column: number | null;
  length: number | null;
  detail: string;
  context: string;
}

export function lintSource(source: string, overrides: RuleOverrides = {}): LintIssue[] {
  const choices = validateOverrides(overrides);
  const config: Configuration = { ...LINT_PROFILE };
  for (const rule of LINT_RULES) {
    config[rule.id] = ruleEnabled(rule, choices) ? (LINT_PROFILE[rule.id] ?? true) : false;
  }
  const results = lint({ strings: { document: source }, config,
    frontMatter: null, noInlineConfig: true });
  return (results.document ?? []).map(issue => ({
    rule: issue.ruleNames[0], message: issue.ruleDescription,
    line: issue.lineNumber, column: issue.errorRange?.[0] ?? null,
    length: issue.errorRange?.[1] ?? null, detail: issue.errorDetail ?? "",
    context: (issue.errorContext ?? "").slice(0, 240),
  })).sort((a,b) => a.line - b.line || (a.column ?? 0) - (b.column ?? 0) || a.rule.localeCompare(b.rule));
}
