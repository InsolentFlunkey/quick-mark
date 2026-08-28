import { getCurrentWindow, type CloseRequestedEvent } from "@tauri-apps/api/window";
import { message } from "@tauri-apps/plugin-dialog";
import type { UnsavedChoice } from "./unsaved-changes";

export async function promptUnsavedChanges(displayName: string, action: string): Promise<UnsavedChoice> {
  const result = await message(`Save changes to ${displayName} before ${action.toLowerCase()}?`, {
    title: "Unsaved changes",
    kind: "warning",
    buttons: { yes: "Save", no: "Discard", cancel: "Cancel" },
  });
  if (result === "Save") return "save";
  if (result === "Discard") return "discard";
  return "cancel";
}

export function onCloseRequested(handler: (event: CloseRequestedEvent) => void | Promise<void>) {
  return getCurrentWindow().onCloseRequested(handler);
}

export function destroyCurrentWindow() {
  return getCurrentWindow().destroy();
}
