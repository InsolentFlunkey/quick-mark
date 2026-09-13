# Installing QuickMark

[README](../README.md)

Use an installer you built or obtained from a trusted source. If you do not have a package, follow [Building on Windows](build-windows.md) or [Building on Linux](build-linux.md). A prebuilt download is not required to use those guides.

## Install and run on Linux

The current Linux distribution is an unsigned RPM built for Fedora-compatible systems. Install a downloaded package with:

```bash
sudo dnf install ./QuickMark-*.rpm
```

Launch **QuickMark** from the desktop application menu or run `quick-mark` in a terminal. A Markdown or text file can also be opened from the application menu, passed on the command line, or associated with QuickMark through the desktop's **Open With** interface:

```bash
quick-mark notes.md
```

The RPM declares its runtime libraries, so `dnf` installs any missing dependencies. Rust, Node.js, npm, compilers, and development headers are not required to run the installed application.

To remove QuickMark:

```bash
sudo dnf remove quick-mark
```

### Supported files and current limitations

QuickMark opens and saves `.md`, `.markdown`, and `.txt` files. Its Markdown dialect is defined in [Markdown support](markdown.md); embedded HTML is escaped for safety.

Linux is currently distributed only as an unsigned RPM. The package is tied to the Linux/glibc compatibility baseline of the system on which it was built; build release artifacts on the oldest supported Linux baseline. Windows builds use an unsigned NSIS installer as described in [Building on Windows](build-windows.md). QuickMark supports multiple document tabs and detachable editor windows; README, Markdown Cheat Sheet, and Markdown Examples open in separate reference windows.

## Install and run on Windows

The Windows package is a 64-bit NSIS installer (`QuickMark_0.1.0_x64-setup.exe` for the current version). Run the installer, choose an installation directory for your Windows account, and launch **QuickMark** from the Start menu. The installer is not code-signed, so Windows may show an unknown-publisher or reputation warning. Only install an artifact you built or obtained from a trusted source.

The application requires Microsoft Edge WebView2 Runtime. The installer downloads and installs it if missing; that step needs an internet connection. Node.js, Rust, Visual Studio, and the Windows SDK are development tools and are not required to run QuickMark.

Use **File → Open** to open `.md`, `.markdown`, or `.txt` documents. The installer registers those extensions for QuickMark; use Windows **Open with → Choose another app** to select your preferred default. Windows controls the default application choice. You can also pass a document path to the installed executable in PowerShell:

```powershell
& 'C:\path\to\QuickMark\quick-mark.exe' 'C:\path\to\notes.md'
```

To update manually, save your work and close QuickMark, then run the newer installer for the same Windows account and installation directory. Automatic updates and signed releases are not configured. Upgrade testing across different application versions remains future release work. Remove QuickMark through Windows **Settings → Apps → Installed apps**.

Windows verification currently targets the maintainer's x64 PC. ARM64, older Windows versions, machines without WebView2, and managed enterprise installations have not been verified.
