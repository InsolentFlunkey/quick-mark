import { describe, expect, it, vi } from "vitest";
import { createScrollSyncController, interpolateMapping } from "../src/scroll-sync";
import { CASES, fixture, dimensions, summary } from "../research/performance/fixtures.mjs";

describe("performance measurement inputs and deterministic work bounds", () => {
  it("generates reproducible fixtures with the advertised structures and actual sizes", () => {
    for (const [name, minimum] of [["mixed-256k", 256 * 1024], ["mixed-1m", 1024 * 1024]] as const) {
      const source = fixture(name);
      expect(fixture(name)).toBe(source);
      expect(dimensions(source).bytes).toBeGreaterThanOrEqual(minimum);
      expect(dimensions(source).bytes).toBeLessThan(minimum + 1000);
      expect(source).toContain("```js"); expect(source).toContain("| Alpha | 12 |");
      expect(source).toContain("[section link](#section-"); expect(source).toContain("  - Nested");
      expect(source).not.toMatch(/https?:|!\[/);
    }
    expect(CASES).toHaveLength(6);
    expect(fixture("wrapped-200k")).toHaveLength(200_000);
    expect(fixture("lines-50k").match(/\n/g)).toHaveLength(50_000);
    expect(fixture("dense-table").match(/\[missing\]/g)).toHaveLength(10_000);
    expect(() => fixture("unknown")).toThrow();
    expect(summary([4, 1, 2, 3])).toEqual({ samples: [4, 1, 2, 3], median: 2.5, max: 4 });
  });

  it("keeps cached interpolation logarithmic as mapping grows to 100,000 anchors", () => {
    let reads = 0;
    const points = Array.from({ length: 100_000 }, (_, i) => ({
      get source() { reads++; return i * 10; }, target: i * 20,
    }));
    expect(interpolateMapping(points, 543215)).toBe(1086430);
    expect(reads).toBeLessThan(50);
  });

  it("coalesces scroll bursts, reuses geometry, and remeasures once after invalidation", () => {
    const editor = document.createElement("textarea"), preview = document.createElement("div");
    let serial = 0; const queue = new Map<number, FrameRequestCallback>();
    const flush = () => { const pending = [...queue.values()]; queue.clear(); pending.forEach(fn => fn(0)); };
    const measure = vi.fn(() => ({ sourceExtent: 1000, targetExtent: 2000,
      points: [{ source: 0, target: 0 }, { source: 1000, target: 2000 }] }));
    const controller = createScrollSyncController({ editor, preview, getSource: () => "source", measure,
      scheduleFrame: fn => { queue.set(++serial, fn); return serial; }, cancelFrame: id => { queue.delete(id); } });
    controller.setActive(true); flush(); flush(); expect(measure).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 1000; i++) { editor.scrollTop = i; editor.dispatchEvent(new Event("scroll")); }
    expect(queue.size).toBe(1); flush(); flush();
    expect(measure).toHaveBeenCalledTimes(1); expect(preview.scrollTop).toBe(1998);
    for (let i = 0; i < 100; i++) controller.contentRendered();
    expect(queue.size).toBe(1); flush(); flush(); expect(measure).toHaveBeenCalledTimes(2);
    controller.destroy();
    editor.dispatchEvent(new Event("scroll")); expect(queue.size).toBe(0);
  });
});
