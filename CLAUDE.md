# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Home Assistant dashboard designed for a Raspberry Pi with a 720x720px round display. Displays real-time weather/sensor data via concentric SVG gauges, sparkline charts, wind compasses, and multi-room indoor readings.

## Commands

```bash
pnpm install          # Install dependencies
pnpm start            # Production server (node server.js) on port 3000
pnpm dev              # Development server with auto-reload (nodemon)
```

No test runner or linter is configured.

## Architecture

### Backend (`server.js`)
Express server that:
- Serves static files from `public/`
- Exposes `/api/env-config` to pass environment variables to the frontend
- Proxies Home Assistant API calls via `/api/proxy/*` (handles CORS, gzip decompression, history API transforms)

### Frontend (`public/`)
Vanilla JavaScript using ES6 modules. No build step — files are served directly.

**Initialization flow** (`app.js` → `app-initializer.js`):
1. Wait for DOM ready
2. Fetch env config from backend (`/api/env-config`)
3. Load localStorage settings
4. Initialize gauges, sparklines, clock
5. Connect to Home Assistant WebSocket (auto-reconnects with exponential backoff)
6. Register entity listeners for real-time updates

**Key modules:**
- `ha-connection.js` — WebSocket connection to Home Assistant, state subscriptions, auto-reconnect with ping/pong keepalive
- `entity-listeners.js` — Maps HA entity state changes to UI update callbacks
- `gauge-manager.js` — Central controller for all gauge updates
- `gauges/` — Individual gauge renderers (temperature, humidity, pressure, rainfall) using SVG arcs with dynamic color gradients
- `config.js` — Value ranges, gauge dimensions (radii, center points), color schemes, weather icon mappings
- `sparkline-utils.js` + `*-history.js` — 24h sparkline charts for temp/humidity/pressure/rainfall
- `wind-display.js` — Wind direction/speed compass with Beaufort scale
- `room-manager.js` — Multi-room indoor display (up to 5 rooms)
- `ui-manager.js` — DOM update functions for sensor values, trends, weather conditions
- `status-overlay.js` — Hidden status overlay (triple-tap to open) with connection info and admin actions
- `dewpoint-utils.js` — Dew point calculation and display

**Data flow:** HA WebSocket → `ha-connection.js` → `entity-listeners.js` → gauge/sparkline/UI update functions → DOM/SVG re-render

### Configuration
- `.env` file in project root — HA URL, access token, 30+ entity ID mappings (source of truth)
- `config.js` — Frontend display settings, gauge geometry, color scales
- localStorage — Display preferences (rain view toggle)

### CSS
Modular CSS in `public/css/modules/` imported by `style.css`. Dark theme (#121212). Layouts designed for circular 720x720 display.

## Code Style

- **Indentation:** Tabs, width 3 (per `.editorconfig` for JS/CSS/HTML)
- **Note:** `.prettierrc` exists with `tabWidth: 2, useTabs: false` which conflicts with `.editorconfig` — follow `.editorconfig` (tabs, width 3) as it reflects the actual codebase style
- **Quotes:** Single quotes
- **Semicolons:** Yes
- **Line endings:** LF
- **Module system:** ES6 `import`/`export` in frontend, CommonJS `require` in `server.js`
