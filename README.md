# Zen Notes

A beautiful note-taking app built with Tauri, Preact, and Tailwind CSS. Features markdown preview, customizable block titles, and a clean, modern interface.

![](screenshot.png)

## Features

- **Block-based Notes**: Organize your notes in customizable blocks
- **Markdown Preview**: Toggle between edit and preview modes with full markdown support
- **Custom Titles**: Each block can have its own title
- **Modern UI**: Clean, responsive design with dark mode support
- **Cross-platform**: Built with Tauri for native performance

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/) or [Bun](https://bun.sh/)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Run the development server:
   ```bash
   bun run dev
   ```

4. Run the Tauri app:
   ```bash
   bun run tauri dev
   ```

## Usage

- **Creating Notes**: Click "New Block, Click Me" to add a new note block
- **Editing Titles**: Click on any block title to edit it
- **Markdown Preview**: Click the "Preview" button to see rendered markdown
- **Writing Notes**: Use the textarea to write your notes in markdown format

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)