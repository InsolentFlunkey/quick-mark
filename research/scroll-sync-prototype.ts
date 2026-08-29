import type MarkdownIt from "markdown-it";

export interface MappingPoint {
  source: number;
  target: number;
}

export interface SourceAnchor {
  type: string;
  startLine: number;
  endLine: number;
}

export function extractSourceAnchors(parser: MarkdownIt, markdown: string): SourceAnchor[] {
  const byStartLine = new Map<number, { anchor: SourceAnchor; level: number }>();
  for (const token of parser.parse(markdown, {})) {
    if (!token.map || token.nesting < 0) continue;
    const [startLine, endLine] = token.map;
    const current = byStartLine.get(startLine);
    if (!current || token.level < current.level) {
      byStartLine.set(startLine, { anchor: { type: token.type, startLine, endLine }, level: token.level });
    }
  }
  return [...byStartLine.values()].map(({ anchor }) => anchor).sort((left, right) => left.startLine - right.startLine);
}

export function normalizeMappingPoints(points: readonly MappingPoint[]): MappingPoint[] {
  const sorted = [...points].sort((left, right) => left.source - right.source || left.target - right.target);
  const normalized: MappingPoint[] = [];
  for (const point of sorted) {
    if (!Number.isFinite(point.source) || !Number.isFinite(point.target)) continue;
    const previous = normalized.at(-1);
    if (previous?.source === point.source) {
      previous.target = Math.max(previous.target, point.target);
      continue;
    }
    normalized.push({ source: point.source, target: Math.max(previous?.target ?? 0, point.target) });
  }
  return normalized;
}

export function interpolateMapping(points: readonly MappingPoint[], sourcePosition: number): number {
  const normalized = normalizeMappingPoints(points);
  if (normalized.length === 0) return 0;
  if (sourcePosition <= normalized[0].source) return normalized[0].target;
  if (sourcePosition >= normalized.at(-1)!.source) return normalized.at(-1)!.target;

  let low = 0;
  let high = normalized.length - 1;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (normalized[middle].source <= sourcePosition) low = middle;
    else high = middle;
  }

  const before = normalized[low];
  const after = normalized[high];
  const progress = (sourcePosition - before.source) / (after.source - before.source);
  return before.target + progress * (after.target - before.target);
}

export function proportionalMapping(sourcePosition: number, sourceExtent: number, targetExtent: number): number {
  if (sourceExtent <= 0 || targetExtent <= 0) return 0;
  return Math.min(targetExtent, Math.max(0, (sourcePosition / sourceExtent) * targetExtent));
}

export function maximumMappingError(
  mapper: (sourcePosition: number) => number,
  expected: readonly MappingPoint[],
): number {
  return Math.max(0, ...expected.map((point) => Math.abs(mapper(point.source) - point.target)));
}
