import { message } from "@tauri-apps/plugin-dialog";
import type { ExternalPrompt } from "./editor-coordination";

export const promptExternalChange: ExternalPrompt = async (name, action, detail) => {
  if (action === "reload") {
    const choice = await message(`${name}\n\n${detail}`, {
      title: "Reload from Disk", kind: "warning", buttons: { ok: "Reload from Disk", cancel: "Cancel" },
    });
    return choice === "Reload from Disk" ? "reload" : "cancel";
  }
  const choice = await message(`${name}\n\n${detail}`, {
    title: "External file change", kind: "warning",
    buttons: { yes: "Overwrite Disk File", no: "Save As", cancel: "Cancel" },
  });
  return choice === "Overwrite Disk File" ? "overwrite" : choice === "Save As" ? "save-as" : "cancel";
};
