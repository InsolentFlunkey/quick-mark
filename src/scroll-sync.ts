export interface MappingPoint {
  source: number;
  target: number;
}

export interface ScrollMeasurements {
  points: MappingPoint[];
  sourceExtent: number;
  targetExtent: number;
}

type ScrollOwner = "source" | "preview";

export function normalizeMappingPoints(points: readonly MappingPoint[]): MappingPoint[] {
  const sorted = [...points].sort((left, right) => left.source - right.source || left.target - right.target);
  const result: MappingPoint[] = [];
  for (const point of sorted) {
    if (!Number.isFinite(point.source) || !Number.isFinite(point.target)) continue;
    const previous = result[result.length - 1];
    if (previous?.source === point.source) {
      previous.target = Math.max(previous.target, point.target);
    } else {
      result.push({ source: point.source, target: Math.max(previous?.target ?? 0, point.target) });
    }
  }
  return result;
}

export function interpolateMapping(points: readonly MappingPoint[], position: number): number {
  if (points.length === 0) return 0;
  if (position <= points[0].source) return points[0].target;
  if (position >= points[points.length - 1].source) return points[points.length - 1].target;
  let low = 0;
  let high = points.length - 1;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle].source <= position) low = middle;
    else high = middle;
  }
  const before = points[low];
  const after = points[high];
  const progress = (position - before.source) / (after.source - before.source);
  return before.target + progress * (after.target - before.target);
}

export function mapScrollPosition(measurements: ScrollMeasurements, position: number): number {
  const points = normalizeMappingPoints(measurements.points);
  return mapNormalizedScrollPosition({ ...measurements, points }, position);
}

function mapNormalizedScrollPosition(measurements: ScrollMeasurements, position: number): number {
  const { points } = measurements;
  if (points.length >= 2) return interpolateMapping(points, position);
  if (measurements.sourceExtent <= 0 || measurements.targetExtent <= 0) return 0;
  return Math.min(
    measurements.targetExtent,
    Math.max(0, (position / measurements.sourceExtent) * measurements.targetExtent),
  );
}

function lineOffsets(source: string): number[] {
  const offsets = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") offsets.push(index + 1);
  }
  return offsets;
}

function createSourceMirror(editor: HTMLTextAreaElement, source: string, lines: readonly number[]): Map<number, number> {
  const mirror = editor.ownerDocument.createElement("div");
  const computed = getComputedStyle(editor);
  Object.assign(mirror.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    visibility: "hidden",
    pointerEvents: "none",
    boxSizing: computed.boxSizing,
    width: `${editor.clientWidth}px`,
    minHeight: "0",
    height: "auto",
    padding: computed.padding,
    border: computed.border,
    font: computed.font,
    letterSpacing: computed.letterSpacing,
    tabSize: computed.tabSize,
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
  });
  mirror.setAttribute("aria-hidden", "true");
  const offsets = lineOffsets(source);
  const markers = new Map<number, HTMLElement>();
  let cursor = 0;
  for (const line of [...new Set(lines)].sort((left, right) => left - right)) {
    const offset = offsets[line];
    if (offset === undefined) continue;
    mirror.append(editor.ownerDocument.createTextNode(source.slice(cursor, offset)));
    const marker = editor.ownerDocument.createElement("span");
    marker.style.display = "inline-block";
    marker.style.width = "0";
    marker.style.height = "0";
    marker.dataset.sourceLineMarker = String(line);
    mirror.append(marker);
    markers.set(line, marker);
    cursor = offset;
  }
  mirror.append(editor.ownerDocument.createTextNode(`${source.slice(cursor)}\u200b`));
  editor.ownerDocument.body.append(mirror);
  const positions = new Map([...markers].map(([line, marker]) => [line, marker.offsetTop]));
  mirror.remove();
  return positions;
}

export function measureScrollAnchors(
  editor: HTMLTextAreaElement,
  preview: HTMLElement,
  source: string,
): ScrollMeasurements {
  const sourceExtent = Math.max(0, editor.scrollHeight - editor.clientHeight);
  const targetExtent = Math.max(0, preview.scrollHeight - preview.clientHeight);
  const previewTop = preview.getBoundingClientRect().top;
  const elements = [...preview.querySelectorAll<HTMLElement>("[data-source-line]")];
  const lines = elements.map((element) => Number(element.dataset.sourceLine)).filter(Number.isFinite);
  const sourcePositions = createSourceMirror(editor, source, lines);
  const byLine = new Map<number, number>();
  for (const element of elements) {
    const line = Number(element.dataset.sourceLine);
    if (!Number.isFinite(line) || byLine.has(line)) continue;
    const position = element.getBoundingClientRect().top - previewTop + preview.scrollTop;
    byLine.set(line, Math.min(targetExtent, Math.max(0, position)));
  }
  const points: MappingPoint[] = [{ source: 0, target: 0 }];
  for (const [line, target] of byLine) {
    const sourcePosition = sourcePositions.get(line);
    if (sourcePosition !== undefined) {
      points.push({ source: Math.min(sourceExtent, Math.max(0, sourcePosition)), target });
    }
  }
  points.push({ source: sourceExtent, target: targetExtent });
  return { points: normalizeMappingPoints(points), sourceExtent, targetExtent };
}

export interface ScrollSyncController {
  setActive(active: boolean): void;
  contentRendered(): void;
  refresh(): void;
  destroy(): void;
}

export interface ScrollSyncDependencies {
  editor: HTMLTextAreaElement;
  preview: HTMLElement;
  getSource(): string;
  measure?: typeof measureScrollAnchors;
  scheduleFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
}

export function createScrollSyncController(dependencies: ScrollSyncDependencies): ScrollSyncController {
  const { editor, preview } = dependencies;
  const measure = dependencies.measure ?? measureScrollAnchors;
  const scheduleFrame = dependencies.scheduleFrame ?? requestAnimationFrame;
  const cancelFrame = dependencies.cancelFrame ?? cancelAnimationFrame;
  let active = false;
  let owner: ScrollOwner = "source";
  let measurements: ScrollMeasurements | null = null;
  let reverse: ScrollMeasurements | null = null;
  let scheduled: number | null = null;
  let ignoreSource = false;
  let ignorePreview = false;

  const refresh = () => {
    const measured = measure(editor, preview, dependencies.getSource());
    measurements = { ...measured, points: normalizeMappingPoints(measured.points) };
    reverse = {
      points: normalizeMappingPoints(measurements.points.map((point) => ({ source: point.target, target: point.source }))),
      sourceExtent: measurements.targetExtent,
      targetExtent: measurements.sourceExtent,
    };
  };

  const synchronize = () => {
    scheduled = null;
    if (!active) return;
    if (!measurements) refresh();
    if (!measurements) return;
    if (owner === "source") {
      ignorePreview = true;
      preview.scrollTop = mapNormalizedScrollPosition(measurements, editor.scrollTop);
      scheduleFrame(() => { ignorePreview = false; });
    } else {
      ignoreSource = true;
      editor.scrollTop = mapNormalizedScrollPosition(reverse!, preview.scrollTop);
      scheduleFrame(() => { ignoreSource = false; });
    }
  };

  const scheduleSynchronization = () => {
    if (scheduled !== null) return;
    scheduled = scheduleFrame(synchronize);
  };

  const invalidate = () => {
    measurements = null;
    reverse = null;
    scheduleSynchronization();
  };

  const onSourceScroll = () => {
    if (!active || ignoreSource) return;
    owner = "source";
    scheduleSynchronization();
  };
  const onPreviewScroll = () => {
    if (!active || ignorePreview) return;
    owner = "preview";
    scheduleSynchronization();
  };
  const onPreviewLayout = (event: Event) => {
    if (event.target instanceof HTMLImageElement) invalidate();
  };

  editor.addEventListener("scroll", onSourceScroll, { passive: true });
  preview.addEventListener("scroll", onPreviewScroll, { passive: true });
  preview.addEventListener("load", onPreviewLayout, true);
  preview.addEventListener("error", onPreviewLayout, true);
  const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(invalidate);
  resizeObserver?.observe(editor);
  resizeObserver?.observe(preview);

  return {
    setActive(nextActive) {
      active = nextActive;
      if (active) { owner = "source"; invalidate(); }
      else if (scheduled !== null) { cancelFrame(scheduled); scheduled = null; }
    },
    contentRendered() {
      owner = "source";
      invalidate();
    },
    refresh,
    destroy() {
      active = false;
      if (scheduled !== null) cancelFrame(scheduled);
      editor.removeEventListener("scroll", onSourceScroll);
      preview.removeEventListener("scroll", onPreviewScroll);
      preview.removeEventListener("load", onPreviewLayout, true);
      preview.removeEventListener("error", onPreviewLayout, true);
      resizeObserver?.disconnect();
    },
  };
}
