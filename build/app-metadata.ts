import { readFileSync } from "node:fs";

export interface AppMetadata {
  name: string;
  version: string;
  publisher: string;
  homepage: string;
  description: string;
}

type JsonObject = Record<string, unknown>;

function objectField(value: unknown, field: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Tauri metadata field ${field} must be an object.`);
  }
  return value as JsonObject;
}

function stringField(object: JsonObject, field: string): string {
  const value = object[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Tauri metadata field ${field} must be a non-empty string.`);
  }
  return value;
}

export function appMetadataFromManifest(manifest: unknown): AppMetadata {
  const root = objectField(manifest, "root");
  const bundle = objectField(root.bundle, "bundle");
  const name = stringField(root, "productName");
  const version = stringField(root, "version");
  const publisher = stringField(bundle, "publisher");
  const homepage = stringField(bundle, "homepage");
  const description = stringField(bundle, "shortDescription");
  const url = new URL(homepage);
  if (url.protocol !== "https:") throw new Error("Tauri metadata homepage must use HTTPS.");

  return Object.freeze({
    name,
    version,
    publisher,
    homepage,
    description,
  });
}

export function loadAppMetadata(path: string): AppMetadata {
  return appMetadataFromManifest(JSON.parse(readFileSync(path, "utf8")));
}
