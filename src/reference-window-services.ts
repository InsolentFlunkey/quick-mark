import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export type ReferenceKind = "readme" | "examples" | "cheat-sheet";

const options = {
  "cheat-sheet": { title: "QuickMark Markdown Cheat Sheet", width: 900, height: 760, minWidth: 480, minHeight: 360 },
  readme: { title: "QuickMark README", width: 800, height: 700, minWidth: 480, minHeight: 360 },
  examples: { title: "QuickMark Markdown Examples", width: 1100, height: 760, minWidth: 640, minHeight: 480 },
} as const;

export async function openReferenceWindow(kind: ReferenceKind) {
  const existing = await WebviewWindow.getByLabel(kind);
  if (existing) {
    await existing.show();
    await existing.setFocus();
    return "focused" as const;
  }

  const window = new WebviewWindow(kind, {
    ...options[kind],
    url: `/reference.html?kind=${kind}`,
    center: true,
  });
  await new Promise<void>((resolve, reject) => {
    window.once("tauri://created", () => resolve());
    window.once("tauri://error", (event) => reject(event.payload));
  });
  return "created" as const;
}
