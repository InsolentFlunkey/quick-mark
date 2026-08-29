import { describe, expect, it, vi } from "vitest";
import {
  createScrollSyncController,
  interpolateMapping,
  mapScrollPosition,
  normalizeMappingPoints,
  type ScrollMeasurements,
} from "../src/scroll-sync";

function frameHarness() {
  let nextId = 1;
  const callbacks = new Map<number, FrameRequestCallback>();
  return {
    schedule(callback: FrameRequestCallback) {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    cancel(id: number) { callbacks.delete(id); },
    flush() {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback(0));
    },
  };
}

function elements() {
  const editor = document.createElement("textarea");
  const preview = document.createElement("div");
  document.body.append(editor, preview);
  return { editor, preview };
}

const measured: ScrollMeasurements = {
  points: [{ source: 0, target: 0 }, { source: 50, target: 120 }, { source: 100, target: 200 }],
  sourceExtent: 100,
  targetExtent: 200,
};

describe("production scroll mapping", () => {
  it("normalizes anchors and interpolates local geometry", () => {
    const points = normalizeMappingPoints([
      { source: 50, target: 120 }, { source: 0, target: 0 }, { source: 50, target: 100 },
      { source: 100, target: 90 },
    ]);
    expect(points).toEqual([{ source: 0, target: 0 }, { source: 50, target: 120 }, { source: 100, target: 120 }]);
    expect(interpolateMapping(measured.points, 75)).toBe(160);
    expect(mapScrollPosition(measured, 25)).toBe(60);
  });

  it("uses proportional fallback when measured anchors are unavailable", () => {
    expect(mapScrollPosition({ points: [], sourceExtent: 100, targetExtent: 360 }, 25)).toBe(90);
    expect(mapScrollPosition({ points: [], sourceExtent: 0, targetExtent: 360 }, 25)).toBe(0);
  });

  it("synchronizes in both directions and suppresses programmatic feedback", () => {
    const { editor, preview } = elements();
    const frames = frameHarness();
    const measure = vi.fn(() => measured);
    const controller = createScrollSyncController({
      editor, preview, getSource: () => "source", measure,
      scheduleFrame: frames.schedule, cancelFrame: frames.cancel,
    });

    controller.setActive(true);
    frames.flush();
    frames.flush();
    editor.scrollTop = 25;
    editor.dispatchEvent(new Event("scroll"));
    frames.flush();
    expect(preview.scrollTop).toBe(60);

    preview.dispatchEvent(new Event("scroll"));
    frames.flush();
    expect(editor.scrollTop).toBe(25);
    frames.flush();

    preview.scrollTop = 160;
    preview.dispatchEvent(new Event("scroll"));
    frames.flush();
    expect(editor.scrollTop).toBe(75);
    controller.destroy();
  });

  it("stays inactive outside Split view and remeasures rendered/image content", () => {
    const { editor, preview } = elements();
    preview.append(document.createElement("img"));
    const frames = frameHarness();
    const measure = vi.fn(() => measured);
    const controller = createScrollSyncController({
      editor, preview, getSource: () => "source", measure,
      scheduleFrame: frames.schedule, cancelFrame: frames.cancel,
    });
    editor.scrollTop = 50;
    editor.dispatchEvent(new Event("scroll"));
    frames.flush();
    expect(preview.scrollTop).toBe(0);

    controller.setActive(true);
    frames.flush();
    frames.flush();
    const initialCalls = measure.mock.calls.length;
    preview.querySelector("img")!.dispatchEvent(new Event("load"));
    frames.flush();
    expect(measure.mock.calls.length).toBeGreaterThan(initialCalls);

    controller.contentRendered();
    frames.flush();
    expect(preview.scrollTop).toBe(120);
    controller.setActive(false);
    editor.scrollTop = 100;
    editor.dispatchEvent(new Event("scroll"));
    frames.flush();
    expect(preview.scrollTop).toBe(120);
    controller.destroy();
  });
});
