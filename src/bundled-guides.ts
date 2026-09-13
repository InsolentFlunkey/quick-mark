import readme from "../README.md?raw";
import installation from "../docs/installation.md?raw";
import editing from "../docs/editing.md?raw";
import linting from "../docs/linting.md?raw";
import markdown from "../docs/markdown.md?raw";
import windows from "../docs/build-windows.md?raw";
import linux from "../docs/build-linux.md?raw";
import development from "../docs/development.md?raw";
import verification from "../docs/release-verification.md?raw";

// Virtual repository paths only: this registry never grants filesystem access.
export const bundledGuides: Readonly<Record<string, string>> = Object.freeze({
  "README.md": readme,
  "docs/installation.md": installation,
  "docs/editing.md": editing,
  "docs/linting.md": linting,
  "docs/markdown.md": markdown,
  "docs/build-windows.md": windows,
  "docs/build-linux.md": linux,
  "docs/development.md": development,
  "docs/release-verification.md": verification,
});

export function resolveBundledGuide(currentPath: string, reference: string): string {
  if (!Object.prototype.hasOwnProperty.call(bundledGuides, currentPath) ||
      !reference || /[\\?#%:]/.test(reference) || reference.startsWith("/")) {
    throw new Error("This link is not a bundled guide.");
  }
  const parts = currentPath.split("/").slice(0, -1);
  for (const part of reference.split("/")) {
    if (part === "." || part === "") continue;
    if (part === "..") {
      if (!parts.length) throw new Error("This link leaves the bundled guides.");
      parts.pop();
    } else parts.push(part);
  }
  const path = parts.join("/");
  if (!Object.prototype.hasOwnProperty.call(bundledGuides, path)) throw new Error("This link is not a bundled guide.");
  return path;
}
