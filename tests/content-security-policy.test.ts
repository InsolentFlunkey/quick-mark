import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Policy = Record<string, string>;

const config = JSON.parse(readFileSync(resolve(process.cwd(), "src-tauri/tauri.conf.json"), "utf8"));
const production = config.app.security.csp as Policy;
const development = config.app.security.devCsp as Policy;

const deniedDirectives = ["default-src", "object-src", "frame-src", "base-uri", "form-action"];

describe("Tauri content security policy", () => {
  it.each([
    ["production", production],
    ["development", development],
  ] as const)("uses an explicit restrictive %s policy", (_name, policy) => {
    expect(policy).toBeTypeOf("object");
    for (const directive of deniedDirectives) expect(policy[directive]).toBe("'none'");
    expect(policy["script-src"]).toBe("'self'");
    expect(policy["script-src"]).not.toMatch(/unsafe-inline|unsafe-eval|https?:|data:/);
    expect(policy["style-src"]).toBe("'self' 'unsafe-inline'");
    expect(policy["font-src"]).toBe("'self'");
  });

  it("allows only required production IPC and rendered-image sources", () => {
    expect(production["connect-src"]).toBe("ipc: http://ipc.localhost");
    expect(production["connect-src"]).not.toMatch(/https:|wss?:/);
    expect(production["img-src"].split(/\s+/)).toEqual(["'self'", "blob:", "data:", "http:", "https:"]);
  });

  it("adds WebSocket connectivity only to development for Vite hot reload", () => {
    expect(development["connect-src"].split(/\s+/)).toEqual([
      "'self'",
      "ipc:",
      "http://ipc.localhost",
      "ws:",
    ]);
    expect(production["connect-src"]).not.toContain("ws:");
  });

  it("documents every exceptional source and its safety boundary", () => {
    const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");
    for (const term of ["Content Security Policy", "ipc:", "http://ipc.localhost", "blob:", "data:", "HTTP or HTTPS", "Inline styles", "WebSocket"]) {
      expect(readme).toContain(term);
    }
    expect(readme.replace(/\s+/g, " ")).toContain("raw HTML in Markdown remains disabled");
  });
});
