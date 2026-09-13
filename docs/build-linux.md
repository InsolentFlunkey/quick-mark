# Building on Linux

[README](../README.md)

## Prerequisites

The foundation is verified on Fedora Linux 44. Install Tauri's native development dependencies:

```bash
sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file \
  libappindicator-gtk3-devel librsvg2-devel libxdo-devel @c-development
```

Install the stable Rust toolchain with [rustup](https://rustup.rs/) and a supported Node.js release. These are build-time requirements, not RPM runtime requirements. This repository was initially verified with Rust 1.98, Node.js 22.23, WebKitGTK 2.52, and GCC 16.2.

First clone the repository and enter its root directory:

```bash
git clone https://github.com/InsolentFlunkey/quick-mark.git
cd quick-mark
```

From this checkout, install the locked JavaScript dependencies and run the development application:

```bash
npm ci
npm run tauri dev
```

Run all automated checks and build the frontend:

```bash
npm test
npm run build
cd src-tauri
cargo test
cargo fmt --check
cargo check
cd ..
```

Build the release executable and Fedora RPM with:

```bash
npm run tauri build -- --bundles rpm
```

The executable is written to `src-tauri/target/release/quick-mark`; the installable package is written beneath `src-tauri/target/release/bundle/rpm/`. Inspect or install that RPM with:

```bash
rpm -qip src-tauri/target/release/bundle/rpm/QuickMark-*.rpm
sudo dnf install ./src-tauri/target/release/bundle/rpm/QuickMark-*.rpm
```

Tauri Linux bundles inherit the build host's glibc baseline. For broadly distributed releases, build in a controlled environment based on the oldest supported distribution rather than an arbitrary newer workstation.

If Rust was installed while an IDE terminal was already open, restart the terminal or IDE so `$HOME/.cargo/bin` is included in `PATH`.

See [Installing QuickMark](installation.md) for runtime installation and [Release verification](release-verification.md) for smoke checks.
