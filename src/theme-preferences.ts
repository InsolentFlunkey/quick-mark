export type AppTheme = "dark" | "light" | "classic";

export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const THEME_STORAGE_KEY = "quickmark:theme";
export const DEFAULT_THEME: AppTheme = "dark";
export const APP_THEMES: readonly AppTheme[] = ["dark", "light", "classic"];

export function isAppTheme(value: string | null): value is AppTheme {
  return APP_THEMES.includes(value as AppTheme);
}

export function loadTheme(storage: Pick<ThemeStorage, "getItem">): AppTheme {
  const saved = storage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(saved) ? saved : DEFAULT_THEME;
}

export function saveTheme(storage: Pick<ThemeStorage, "setItem">, theme: AppTheme): void {
  storage.setItem(THEME_STORAGE_KEY, theme);
}

export function nativeThemeFor(theme: AppTheme): "dark" | "light" {
  return theme === "light" ? "light" : "dark";
}

export function applyTheme(theme: AppTheme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme;
}
