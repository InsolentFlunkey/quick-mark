import { expect, it, vi } from "vitest";

vi.mock("../src/lint-profile", () => {
  throw new Error("UI state must not load the lint engine or its parsers");
});
import { cloneLintState, PROFILE_VERSION } from "../src/lint-state";

it("validates UI state without loading the lint engine", () => {
  expect(cloneLintState({ profile: PROFILE_VERSION, source: "", status: "complete",
    issues: [], error: "", inspecting: true, pane: "results", selected: 0,
    visible: 200, resultsScroll: 0 }).status).toBe("complete");
});
