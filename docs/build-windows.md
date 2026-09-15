# Building on Windows

[README](../README.md)

## Prerequisites

Build natively on 64-bit Windows using PowerShell. The initial build environment is Windows 11 Pro (build 26200), Node 22.23.2, npm 11.17.0, Rust/Cargo 1.94.0, Visual Studio 18 Build Tools, Windows SDK 10.0.26100.0, and WebView2 152.0.4191.66. Install these build-time prerequisites:

- Git for Windows.
- Node.js **22.22.2 or later in the 22.x series**, with npm. The locked `jsdom` dependency requires this minimum; Node 22.17.0 produces `EBADENGINE` warnings. Newer Node major versions must also meet the locked dependencies' engine requirements.
- Stable Rust through [rustup](https://rustup.rs/), using the `x86_64-pc-windows-msvc` toolchain.
- Visual Studio Build Tools with **Desktop development with C++**, including MSVC x64/x86 tools and a Windows SDK.
- Microsoft Edge WebView2 Runtime, used by both development and release applications.

See [Tauri's Windows prerequisites](https://v2.tauri.app/start/prerequisites/#windows) for the native tool installation steps. Restart VS Code after installing or upgrading tools so its terminals inherit the updated environment. Verify the active tools:

```powershell
node --version
npm --version
rustc --version
cargo --version
rustup show active-toolchain
```

First clone the repository and enter its root directory:

```powershell
git clone https://github.com/InsolentFlunkey/quick-mark.git
cd quick-mark
```

## One-command installer build

After installing the prerequisites and checking out the repository, run this in
Windows PowerShell 5.1 or PowerShell 7:

```powershell
.\scripts\build-windows.ps1
```

You can also invoke the script by its full path from another directory. It finds
the checkout from its own location. Preview the build sequence without running
tools or changing files:

```powershell
.\scripts\build-windows.ps1 -Plan
```

The script checks tool availability, Node's minimum version and the Windows x64
MSVC Rust host. It installs locked JavaScript dependencies with `npm ci
--engine-strict`, runs the frontend tests/build and production lint-worker check,
runs the Rust tests/formatting/compile checks, and builds the NSIS installer with
locked Cargo dependencies. Tauri also runs its configured frontend build before
packaging. The script stops on the first error with a nonzero exit code; resolve
that error and rerun the command. It does not skip failed checks.

Dependency installation may download npm and Cargo packages; first-time packaging
may download NSIS tools. Allow network access for these steps. `npm ci` replaces
the generated `node_modules` directory using the lockfile. Install Git, Node,
Rust, Visual Studio's C++ tools/Windows SDK and WebView2 manually as described
above. If PowerShell policy prevents script execution, follow your machine's
script-signing policy; the script does not change execution policy.

Successful builds print the executable and newly written installer paths under
`src-tauri/target/release/`. Packaging explicitly uses this target directory.
Existing installers are retained, but are not reported as a successful new build.
Close a running release executable before rebuilding it. The script does not
install or launch QuickMark: run the generated installer and complete the
[Windows release smoke test](release-verification.md) afterward.

## Individual development and verification commands

For development, install the locked JavaScript dependencies and launch development mode:

```powershell
npm ci
npm run tauri dev
```

Run automated checks and build the frontend:

```powershell
npm test
npm run build
node scripts/check-lint-worker.mjs
cargo test --locked --manifest-path src-tauri/Cargo.toml
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

Build the Windows release and NSIS installer:

```powershell
npm.cmd run tauri -- build --bundles nsis -- --locked
```

Use `npm.cmd` for this command in PowerShell so both `--` separators reach npm and Tauri. The final `--locked` is passed to Cargo. Tauri automatically merges `src-tauri/tauri.windows.conf.json` on Windows. It enables an NSIS `.exe` installer for the current user; Linux retains its separate RPM configuration. The installer uses Tauri's WebView2 download bootstrapper when the runtime is missing, which requires network access. See [Tauri's Windows installer documentation](https://v2.tauri.app/distribute/windows-installer/) for that runtime behavior.

The release executable is `src-tauri/target/release/quick-mark.exe`; installers are written beneath `src-tauri/target/release/bundle/nsis/`. No code-signing certificate is configured. Packaging may download the NSIS tools on the first build.

See [Installing QuickMark](installation.md) for runtime requirements and [Release verification](release-verification.md) for installer smoke checks.
