# Threeflux

Port of the Miniflux Companion Chrome extension to Firefox.

Source: https://codeberg.org/gbcox/miniflux-companion (GPL v3)

## Project Structure

Root-level extension files (static, not in Vite build):
  manifest.json         — Firefox MV3 manifest (cross-browser)
  background.js         — Background script (badge, alarms, click handler)
  options.html          — Options page (inline CSS)
  options.js            — Options page logic
  settings-utils.js     — Shared: defaults, URL parse, keywords, connection test
  storage-utils.js      — Shared: migration from browser.storage.sync → local

src/ (Vite + React 19 enhanced three-pane reader):
  index.jsx             — Entry: loads settings, renders App
  App.jsx               — Main reader app (three-pane layout)
  FeedBrowser.jsx       — Category/feed navigation pane
  FeedContextMenu.jsx   — Context menus for feeds
  ItemBrowser.jsx       — Entry list pane
  ItemViewer.jsx        — Article content pane
  ClickNHold.jsx        — Long-press utility component
  Icon.jsx              — Icon wrapper
  KeyHelpModal.jsx      — Keyboard shortcuts help
  runtimeConfig.js      — Global config singleton
  globalStyles.js       — Global styled-components styles
  layout.js             — Pane layout persistence
  readStateStyles.js    — Read/unread CSS
  themes.js             — Light/dark/auto theme
  lib/util.jsx          — Miniflux API client (fetch + badge refresh)

test/ — Node.js tests (node --test)

## Build & Test Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run the extension in a temporary Firefox profile (auto-reloads on changes)
web-ext run --source-dir=.

# Build the Vite-enhanced reader + static files for both browsers
npm run build

# Build for a single browser
npm run build:firefox
npm run build:chrome

# Lint the extension
web-ext lint --source-dir=.

# Check formatting
npm run format:check
```

## Cross-Browser Build

The same codebase produces both Firefox and Chrome extensions via `webextension-polyfill`.

- **Source**: all files use `import browser from 'webextension-polyfill'`, which maps to `browser.*` (Firefox native) or `chrome.*` with Promise wrapping (Chrome).
- **Manifest generation**: the build script generates browser-specific manifests:
  - `dist-firefox/manifest.json` — includes `browser_specific_settings`, `version_name`, cross-browser `background.scripts` + `background.service_worker`
  - `dist-chrome/manifest.json` — strips Firefox-only keys, `service_worker` only
- **Output**:
  - `web-ext-artifacts/threeflux-{version_name}-firefox.zip`
  - `web-ext-artifacts/threeflux-{version_name}-chrome.zip`
- **Vite output** is shared — the React app is identical for both browsers, only the manifest + polyfill differ

## Versioning

Dual-version scheme to avoid merge conflicts with upstream tags:

| File | Field | Example | Format |
|---|---|---|---|
| `manifest.json` | `version` | `2.7.1.1` | Dot-numbers only (Firefox/AMO requirement). 4th segment = our revision counter. |
| `package.json` | `version` | `2.7.1-3f.1` | npm semver with `-3f` prerelease tag. Used as `version_name` for packaging. |
| `package-lock.json` | `version` | `2.7.1-3f.1` | Same as package.json. |

- `npm run package` reads `version` from package.json and names the output `threeflux-{version_name}.zip`
- Git tags use `v2.7.1-3f.N` format
- Increment only the last segment: `2.7.1-3f.1` → `2.7.1-3f.2` (manifest `version` → `2.7.1.2`)
- Upstream uses 3-segment tags (`v2.7.1`), so no collision

## Upstream Upgrades

See `UPGRADE.md` for the full step-by-step workflow. Quick summary:

1. `git fetch upstream --tags`
2. `git checkout v2.8.0 -b release/2.8.0`
3. `find . -type f -name '*.js' -o -name '*.jsx' ! -path './node_modules/*' -exec sed -i 's/chrome\./browser./g' {} +`
4. Apply manual manifest.json Firefox patch (add `browser_specific_settings`, cross-browser background, rename, `version_name`)
5. Simplify any new callback Promise wrappers
6. `npm test && npx web-ext lint --source-dir=.`
7. Merge into `main`, tag `v2.8.0-3f.1`

## Session Save

Saying **"save"** in conversation means:
1. Update this `AGENTS.md` with current progress, decisions, and plan
2. Then run `/compact` to reclaim context

## Conventions

- Use `browser.*` WebExtensions API (Firefox-preferred, native Promise support)
- The original `chrome.*` namespace is NOT used — all APIs use `browser.*`
- `browser.storage.*.get()/.set()/.remove()` return Promises natively — no callback wrappers needed
- `browser.runtime.lastError` is NOT used — errors are thrown as Promise rejections in Firefox
- Run `web-ext lint` before every commit — no warnings allowed

## Manifest (cross-browser MV3)

- Uses both `background.scripts` and `background.service_worker` for cross-browser compatibility:
  - Firefox: uses `scripts` (background page)
  - Chrome: uses `service_worker` (service worker)
- `background.type: "module"` enables ES imports in background scripts (Firefox supports this with `scripts`)
- `browser_specific_settings.gecko.id` is required for Firefox AMO

## Key Differences from Chrome Extension

- `chrome.action` → `browser.action` (same API shape)
- `chrome.storage` → `browser.storage` (native Promises, no callback wrappers)
- `chrome.runtime.*` → `browser.runtime.*` (native Promises)
- `chrome.permissions.request` → `browser.permissions.request` (same API shape)
- Content scripts may need `manifest.json` field `browser_style: false` for custom CSS
- Firefox requires `web_accessible_resources` to use array-of-objects format (MV3 standard)

## Storage

- All extension settings and the API token are stored in `browser.storage.local`
- Nothing is synchronized through Firefox Sync
- Legacy Chrome Sync settings are migrated to local storage on first run
- The API token is sent as `X-Auth-Token` header to the Miniflux server

## Architecture

- **Miniflux API client** (`src/lib/util.jsx`) — wrapped fetch calls to Miniflux server
- **Background script** (`background.js`) — periodic badge refresh via alarms, toolbar icon click handler
- **Options page** (`options.html` + `options.js`) — Miniflux server URL and API token configuration
- **Enhanced reader** (`src/`) — React 19 three-pane RSS reader (categories/feeds, entries, article content)
- **Badge** — Unread count displayed on toolbar icon, configurable colors and refresh interval
