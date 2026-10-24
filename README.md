# Story Architect Desktop

Independent React 19 / Tauri v2 application. Projects are local `.story.json`
files; no API server, account, or internet connection is required at runtime.
Initial dependency installation requires network access.

## Windows development

Install Node.js 22.12+ (or Node.js 24), Rust stable with the MSVC target,
Visual Studio C++ Build Tools, and WebView2 Runtime. In PowerShell:

```powershell
Set-Location C:\Users\staer\story-architect\story-architect-desktop
npm ci
npm run tauri:dev
```

`npm run dev` alone starts only the frontend; native file commands require Tauri.
The directory is independently deployable and can be moved outside this workspace.

## Validation and release

```powershell
npm test
npm run build
cargo test --manifest-path .\src-tauri\Cargo.toml --lib
npm run tauri:build
```

Installers are written under `src-tauri/target/release/bundle`. Test the packaged
application on a clean Windows machine, including offline operation, native
menus, open/save/save-as, HTML export, undo/redo, images, and project recovery.
Signing and installer distribution require release-specific credentials and are
not configured here. Other operating systems require their native Tauri build
prerequisites and independent validation.

Application icons are generated from `app-icon.svg`; regenerate with
`npx tauri icon app-icon.svg` after changing the artwork. The generated native
icons must be shipped with the source project.