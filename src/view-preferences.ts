export type ViewMode = "both" | "input" | "preview";

export interface ViewPreferences {
  readonly mode: ViewMode;
  readonly swapped: boolean;
  readonly syncScrolling: boolean;
}

export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const DEFAULT_VIEW_PREFERENCES: ViewPreferences = Object.freeze({ mode: "both", swapped: false, syncScrolling: true });
export const VIEW_MODE_KEY = "quickmark:view";
export const VIEW_SWAPPED_KEY = "quickmark:swapped";
export const SYNC_SCROLLING_KEY = "quickmark:sync-scrolling";

function isViewMode(value: string | null): value is ViewMode {
  return value === "both" || value === "input" || value === "preview";
}

export function loadViewPreferences(storage: PreferenceStorage): ViewPreferences {
  const mode = storage.getItem(VIEW_MODE_KEY);
  return {
    mode: isViewMode(mode) ? mode : DEFAULT_VIEW_PREFERENCES.mode,
    swapped: storage.getItem(VIEW_SWAPPED_KEY) === "true",
    syncScrolling: loadSyncScrollingPreference(storage),
  };
}

export function saveViewPreferences(storage: PreferenceStorage, preferences: ViewPreferences) {
  storage.setItem(VIEW_MODE_KEY, preferences.mode);
  storage.setItem(VIEW_SWAPPED_KEY, String(preferences.swapped));
  saveSyncScrollingPreference(storage, preferences.syncScrolling);
}

export function loadSyncScrollingPreference(storage: PreferenceStorage): boolean {
  return storage.getItem(SYNC_SCROLLING_KEY) !== "false";
}

export function saveSyncScrollingPreference(storage: PreferenceStorage, enabled: boolean): void {
  storage.setItem(SYNC_SCROLLING_KEY, String(enabled));
}
