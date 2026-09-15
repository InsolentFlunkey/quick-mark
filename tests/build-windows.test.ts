// @vitest-environment node
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

// Run the actual PowerShell entry point against disposable command stubs. Never
// install dependencies or package the real checkout from these orchestration tests.
describe.skipIf(process.platform !== "win32")("Windows build script", () => {
  function run(options: { plan?: boolean; missing?: string; fail?: boolean; stale?: boolean; oldNode?: boolean } = {}) {
    const root = mkdtempSync(join(tmpdir(), "quickmark build test "));
    const bin = join(root, "bin");
    const log = join(root, "commands.txt");
    mkdirSync(bin);
    mkdirSync(join(root, "scripts"));
    copyFileSync(resolve("scripts/build-windows.ps1"), join(root, "scripts/build-windows.ps1"));
    const output = join(root, "src-tauri/target/release/bundle/nsis");
    if (options.stale) {
      mkdirSync(output, { recursive: true });
      writeFileSync(join(output, "old-setup.exe"), "old");
      utimesSync(join(output, "old-setup.exe"), new Date(2000, 0), new Date(2000, 0));
      writeFileSync(join(root, "src-tauri/target/release/quick-mark.exe"), "old");
    }
    const stubs: Record<string, string> = {
      node: `echo ${options.oldNode ? "v22.17.0" : "v22.23.2"}`,
      rustc: "echo host: x86_64-pc-windows-msvc",
      cargo: "echo cargo test stub",
      rustup: "echo stable-x86_64-pc-windows-msvc",
      npm: [
        options.fail ? 'if "%~1"=="test" exit /b 17' : "",
        !options.stale ? [
          'if "%~1"=="run" if "%~2"=="tauri" (',
          '  mkdir "src-tauri\\target\\release\\bundle\\nsis"',
          '  echo executable> "src-tauri\\target\\release\\quick-mark.exe"',
          '  echo installer> "src-tauri\\target\\release\\bundle\\nsis\\test-setup.exe"',
          ')',
        ].join("\r\n") : "",
        "echo npm test stub",
      ].join("\r\n"),
    };
    for (const [name, body] of Object.entries(stubs)) {
      if (name === options.missing) continue;
      writeFileSync(join(bin, `${name}.cmd`), `@echo off\r\necho ${name} %*>> "%TASK_BUILD_LOG%"\r\ncd>> "%TASK_BUILD_LOG%"\r\n${body}\r\nexit /b 0\r\n`);
    }
    try {
      const systemRoot = process.env.SystemRoot!;
      // Strip case-insensitive PATH duplicates so no real build tool can be found.
      const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== "path"));
      const result = spawnSync(join(systemRoot, "System32/WindowsPowerShell/v1.0/powershell.exe"),
        ["-NoProfile", "-NonInteractive", "-File", join(root, "scripts/build-windows.ps1"), ...(options.plan ? ["-Plan"] : [])],
        { cwd: tmpdir(), env: { ...env, PATH: `${bin};${join(systemRoot, "System32")}`, TASK_BUILD_LOG: log }, encoding: "utf8", timeout: 20000 });
      if (result.error) throw result.error;
      let commands = "";
      try { commands = readFileSync(log, "utf8"); } catch { /* Preflight and plan may run no commands. */ }
      return { status: result.status, text: result.stdout + result.stderr, commands, root };
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }

  it("previews commands without invoking tools", () => {
    const result = run({ plan: true, missing: "node" });
    expect(result.status, result.text).toBe(0);
    expect(result.commands).toBe("");
    expect(result.text).toContain("npm.cmd ci --engine-strict");
    expect(result.text).toContain("--bundles nsis -- --locked --target-dir");
  });

  it("runs in the checkout with spaces and reports current artifacts after all checks", () => {
    const result = run();
    expect(result.status, result.text).toBe(0);
    for (const command of ["npm ci --engine-strict", "npm test", "npm run build", "node scripts/check-lint-worker.mjs",
      "cargo test --locked", "cargo fmt --check", "cargo check --locked", "npm run tauri -- build --bundles nsis -- --locked"]) {
      expect(result.commands).toContain(command);
    }
    const lines = result.commands.trim().split(/\r?\n/);
    expect(lines.filter((_, i) => i % 2 === 1).every(line => line === result.root)).toBe(true);
    expect(result.text).toContain(`Installer: ${join(result.root, "src-tauri/target/release/bundle/nsis/test-setup.exe")}`);
    expect(result.text).toContain("Windows installer build succeeded.");
  });

  it("stops at a failing native command with no later build stages", () => {
    const result = run({ fail: true });
    expect(result.status).toBe(1);
    expect(result.text).toContain("exit 17");
    expect(result.commands).not.toContain("npm run build");
    expect(result.commands).not.toContain("cargo test");
    expect(result.text).not.toContain("build succeeded");
  });

  it("reports a missing prerequisite before dependency installation", () => {
    const result = run({ missing: "rustup" });
    expect(result.status).toBe(1);
    expect(result.text).toContain("Missing prerequisite: rustup");
    expect(result.commands).toBe("");
  });

  it("rejects unsupported Node before dependency installation", () => {
    const result = run({ oldNode: true });
    expect(result.status).toBe(1);
    expect(result.text).toContain("too old");
    expect(result.commands).not.toContain("npm ci");
  });

  it("does not report a retained old installer as a successful build", () => {
    const result = run({ stale: true });
    expect(result.status).toBe(1);
    expect(result.text).toContain("no newly written NSIS installer");
    expect(result.text).not.toContain("build succeeded");
  });
});
