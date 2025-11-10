# LabPulse

Operations intelligence dashboard prototype. Interactive. Uses mock data.

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm (install via `npm install -g pnpm` if missing)
- For desktop builds: Rust toolchain (for Tauri)

### Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

## Run with double-click

- **Windows**: Double-click `Start-LabPulse.ps1` (allow script for this session).
- **macOS**: Double-click `start-labpulse.command` (first time: `chmod +x start-labpulse.command`).

### Build Desktop App

```bash
pnpm tauri:build
```

Artifacts output under `src-tauri/target/` (Win .msi/.exe, macOS .app/.dmg).

## Project Structure

```
src/
  components/     # React components
  pages/          # Page routes/views
  lib/            # Utilities and helpers
  models/         # Zod schemas and types
  storage/        # Storage backends (local-json, supabase)
public/           # Static assets
scripts/          # Build and utility scripts
data/             # JSON data files (created at runtime, not committed)
```

## Features

- **Local-first**: All data stored in JSON files by default
- **Manual data entry**: Inline editing with autosave
- **Import**: Drag-drop Excel/CSV or paste tables
- **Dashboard**: Real-time analytics with charts
- **Desktop**: Tauri wrapper for Windows/macOS

## Data Model

See specification in project documentation.

## Milestones

- M0: Scaffold + Hygiene ✅
- M1: Models + Validation + Storage Interface
- M2: Vibe Mode Shell + Data Studio
- M3: Import (Drag-Drop + Paste + Mapper)
- M4: Inline Editors + Autosave
- M5: Dashboard + Live Data
- M6: One-Click Launchers + Tauri
- M7: Optional Supabase Adapter

## License

Private project.

