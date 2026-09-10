import { describe, expect, it } from "vitest";
import { LINT_GROUPS, LINT_RULES, ruleConfigurationKey, validateOverrides } from "../src/lint-rules";
import { lintSource } from "../src/lint-profile";

describe("configurable lint profile", () => {
  it("assigns every pinned active rule exactly once and exposes only MD051 as unavailable", () => {
    expect(LINT_GROUPS).toHaveLength(7);
    expect(LINT_RULES).toHaveLength(53);
    expect(new Set(LINT_RULES.map(rule => rule.id)).size).toBe(53);
    expect(LINT_RULES.filter(rule => !rule.available).map(rule => rule.id)).toEqual(["MD051"]);
    expect(LINT_RULES.filter(rule => !rule.defaultEnabled).map(rule => rule.id)).toEqual(["MD034", "MD051"]);
  });
  it("disables and restores individual rules without losing fixed title options", () => {
    const text = "# Title\n\n# Other\n\n[text]()\n";
    expect(lintSource(text, { MD025: false }).some(issue => issue.rule === "MD025")).toBe(false);
    expect(lintSource(text, { MD025: false }).some(issue => issue.rule === "MD042")).toBe(true);
    expect(lintSource(text, { MD025: true }).some(issue => issue.rule === "MD025")).toBe(true);
    expect(lintSource("---\ntitle: Example\n---\n\nBody.\n", { MD041: true }).some(issue => issue.rule === "MD041")).toBe(true);
  });
  it("allows opt-in bare URL advice, keeps fragment validation unavailable and rejects malformed choices", () => {
    const source = "# Title\n\nhttps://example.com\n\n[x](#missing)\n";
    expect(lintSource(source, { MD034: true }).some(issue => issue.rule === "MD034")).toBe(true);
    expect(lintSource(source).some(issue => issue.rule === "MD034")).toBe(false);
    expect(() => lintSource(source, { MD051: true })).toThrow();
    for (const choices of [[], null, { MD999: true }, { MD025: "false" }]) expect(() => validateOverrides(choices)).toThrow();
  });
  it("identifies effective choices independently of patch order and redundant defaults", () => {
    expect(ruleConfigurationKey({ MD025: true })).toBe(ruleConfigurationKey());
    expect(ruleConfigurationKey({ MD025: false, MD034: true })).toBe(ruleConfigurationKey({ MD034: true, MD025: false }));
    expect(ruleConfigurationKey({ MD025: false })).not.toBe(ruleConfigurationKey());
  });
});
