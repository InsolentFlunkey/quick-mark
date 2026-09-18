import type { PreferenceStorage } from "./view-preferences";

export const LINE_NUMBERS_KEY = "quickmark:line-numbers";

export function loadLineNumbersPreference(storage: PreferenceStorage): boolean {
  return storage.getItem(LINE_NUMBERS_KEY) !== "false";
}

export function saveLineNumbersPreference(storage: PreferenceStorage, enabled: boolean): void {
  storage.setItem(LINE_NUMBERS_KEY, String(enabled));
}
