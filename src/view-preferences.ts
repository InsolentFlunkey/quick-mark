export type ViewMode = "both" | "input" | "preview";

export interface ViewPreferences {
  readonly mode: ViewMode;
  readonly swapped: boolean;
}

export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const DEFAULT_VIEW_PREFERENCES: ViewPreferences = Object.freeze({ mode: "both", swapped: false });
export const VIEW_MODE_KEY = "quickmark:view";
export const VIEW_SWAPPED_KEY = "quickmark:swapped";

function isViewMode(value: string | null): value is ViewMode {
  return value === "both" || value === "input" || value === "preview";
}

export function loadViewPreferences(storage: PreferenceStorage): ViewPreferences {
  const mode = storage.getItem(VIEW_MODE_KEY);
  return {
    mode: isViewMode(mode) ? mode : DEFAULT_VIEW_PREFERENCES.mode,
    swapped: storage.getItem(VIEW_SWAPPED_KEY) === "true",
  };
}

export function saveViewPreferences(storage: PreferenceStorage, preferences: ViewPreferences) {
  storage.setItem(VIEW_MODE_KEY, preferences.mode);
  storage.setItem(VIEW_SWAPPED_KEY, String(preferences.swapped));
}
