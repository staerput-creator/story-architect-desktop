<div align="center">

# 📖 Story Architect Desktop

**Visual Node-Based Interactive Story, Quest & Dialogue Tree Studio**

*A local-first, privacy-focused desktop application built with Tauri v2, Rust, and React 19.*

[![Tauri](https://img.shields.io/badge/Tauri-v2.0-blue?logo=tauri&logoColor=white)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.75+-orange?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![ReactFlow](https://img.shields.io/badge/@xyflow/react-v12-ff0072)](https://reactflow.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)]()

</div>

---

## 🌟 Overview

**Story Architect Desktop** is an enterprise-grade visual narrative development environment designed for game writers, quest designers, and indie developers creating visual novels, text RPGs, and branching interactive fiction.

It combines the performance and security of **Rust (Tauri v2)** with a modern, responsive **React 19** canvas powered by `@xyflow/react`.

### 🔒 100% Local-First & Private
- **Zero Cloud Lock-in:** No mandatory accounts, telemetry, or external API servers.
- **Native File System Access:** Reads and writes atomic, version-controlled `.story.json` files directly to disk.
- **Air-Gapped Operation:** Runs completely offline after initial installation.

---

## ✨ Key Features

### 🗺️ Visual Node Canvas & Multi-Branching
- **Dynamic Choice Handles:** Dedicated output pins for each branching choice, eliminating overlapping lines even when multiple branches lead to the same scene.
- **Draggable Bezier Curves:** Freeform curvature control—drag any edge label to shape connector arcs around obstacles, with double-click reset.
- **Interactive Story Regions:** Group scenes into chapters/acts with resizable colored boundary containers (`<NodeResizer>`).
- **Chapter Navigator:** Jump-to-region timeline with smooth 800ms camera fly-to transitions (`fitBounds`) and `Ctrl + 1..9` hotkeys.

### 🎮 Built-in AAA Visual Novel Simulator
- **Immersive Testing Stage:** Fullscreen background rendering with cinematic radial vignetting.
- **Step-by-Step Dialogue Engine:** Clean glassmorphism dialogue box advancing one line at a time via `Space` / `Enter`.
- **Dynamic Variable & Condition Engine:** Live tracking of flags (boolean) and stats (numerical). Choices automatically evaluate logic gates (`[🔒 Requires: Gold >= 15]`) and lock unavailable branches.

### 🧰 Workflow & Productivity
- **Left Palette & Parking Stash:** Drag-and-drop node spawning precisely under the mouse cursor (`screenToFlowPosition`), plus an off-canvas holding area for drafting unused nodes.
- **Canvas Context Menu:** Right-click anywhere on the viewport for quick scene creation, autolayout, and zoom operations.
- **Standalone HTML Export:** Compiles the entire story, variables, dialogue, and media into a self-contained single-file `.html` game that runs in any web browser.
- **AI / MCP Bridge:** Integrated Model Context Protocol (WebSocket on `127.0.0.1:39123`) allowing local AI agents (Cline, Claude Desktop) to collaborate on the canvas in real time.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Desktop Runtime** | Tauri v2, Rust (atomic FS I/O, native menus, dialogs) |
| **Frontend Core** | React 19, Vite, Tailwind-ready CSS Architecture |
| **Node Graph** | `@xyflow/react` v12 (React 19 native support) |
| **State Management** | Zustand v5 + Zundo (optimized 50-step undo/redo) |
| **Asset Engine** | Decoupled image cache (Base64 stripped from undo snapshots) |
| **Protocol** | Model Context Protocol (TypeScript MCP SDK) |

---

## 🚀 Getting Started (Windows Development)

### Prerequisites

Ensure you have the following installed:
1. **[Node.js](https://nodejs.org/)** (v22.12+ LTS or v24)
2. **[Rust](https://rustup.rs/)** (stable with `x86_64-pc-windows-msvc` target)
3. **Visual Studio 2022 Build Tools** with the *C++ build tools* workload
4. **WebView2 Runtime** (installed by default on Windows 10/11)

### Installation & Local Run

```powershell
# Navigate to the desktop project directory
cd story-architect-desktop

# Install pinned dependencies
npm ci

# Run the native desktop application in dev mode (Tauri + Vite)
npm run tauri:dev
