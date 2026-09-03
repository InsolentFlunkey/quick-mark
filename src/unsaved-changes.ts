import type { OperationOutcome } from "./document-operations";

export type UnsavedChoice = "save" | "discard" | "cancel";

export interface UnsavedChangeDependencies {
  readonly isDirty: () => boolean;
  readonly displayName: () => string;
  readonly prompt: (displayName: string, action: string) => Promise<UnsavedChoice>;
  readonly save: () => Promise<OperationOutcome>;
}

export type UnsavedDecision =
  | { readonly status: "proceed" }
  | {
      readonly status: "canceled" | "failed";
      readonly message: string;
      readonly requiresAttention?: boolean;
    };

export async function resolveUnsavedChanges(
  action: string,
  dependencies: UnsavedChangeDependencies,
): Promise<UnsavedDecision> {
  if (!dependencies.isDirty()) return { status: "proceed" };

  let choice: UnsavedChoice;
  try {
    choice = await dependencies.prompt(dependencies.displayName(), action);
  } catch (error) {
    return { status: "failed", message: `Could not ask about unsaved changes: ${String(error)}` };
  }

  if (choice === "cancel") return { status: "canceled", message: `${action} canceled.` };
  if (choice === "discard") return { status: "proceed" };

  const saveOutcome = await dependencies.save();
  if (saveOutcome.status !== "success") {
    return { status: saveOutcome.status, message: saveOutcome.message };
  }
  if (dependencies.isDirty()) {
    return {
      status: "canceled",
      message: `${action} canceled because the document changed while it was being saved.`,
      requiresAttention: true,
    };
  }
  return { status: "proceed" };
}

export async function protectAction(
  action: string,
  dependencies: UnsavedChangeDependencies,
  operation: () => Promise<OperationOutcome>,
): Promise<OperationOutcome> {
  const decision = await resolveUnsavedChanges(action, dependencies);
  if (decision.status !== "proceed") return decision;
  return operation();
}

export interface SaveShortcutEvent {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
}

export function saveShortcutFor(event: SaveShortcutEvent): "save" | "save-as" | null {
  if (event.altKey || (!event.ctrlKey && !event.metaKey) || event.key.toLowerCase() !== "s") return null;
  return event.shiftKey ? "save-as" : "save";
}
