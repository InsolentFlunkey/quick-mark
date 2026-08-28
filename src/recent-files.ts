export const RECENT_FILES_KEY = "quickmark:recent-files";
export const MAX_RECENT_FILES = 10;

export interface RecentFilesStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function recentFileLabel(path: string) {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

export function normalizeRecentFiles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !item.trim() || seen.has(item)) continue;
    seen.add(item);
    paths.push(item);
    if (paths.length === MAX_RECENT_FILES) break;
  }
  return paths;
}

export function loadRecentFiles(storage: RecentFilesStorage): string[] {
  const stored = storage.getItem(RECENT_FILES_KEY);
  if (!stored) return [];
  try {
    return normalizeRecentFiles(JSON.parse(stored));
  } catch {
    return [];
  }
}

export function saveRecentFiles(storage: RecentFilesStorage, paths: readonly string[]) {
  storage.setItem(RECENT_FILES_KEY, JSON.stringify(normalizeRecentFiles(paths)));
}

export function addRecentFile(paths: readonly string[], path: string) {
  return normalizeRecentFiles([path, ...paths.filter((candidate) => candidate !== path)]);
}

export function removeRecentFile(paths: readonly string[], path: string) {
  return paths.filter((candidate) => candidate !== path);
}
