# Multiflux

Port of the Miniflux Companion Chrome extension to Firefox.

Source: https://codeberg.org/gbcox/miniflux-companion (GPL v3)

## Current State

**v0.1.0** — personal beta, Firefox + Chrome cross-browser builds.

Key features beyond upstream:

-   Global Unread pseudo-feed (filters by `hide_globally` flag)
-   OA (Original Article) mode: new window to the right (default) or new tab
-   Vim-style keyboard aliases (q/k for prev, e/j for next, w for open article, ? for help)
-   `t` key: mark all items older than current as read ("unTil now")
-   Undo toast for `t` and `A` batch mark-read operations (30s, cleared on nav)
-   Entry sort direction and category order from Miniflux server preferences
-   Removed enhanced reader toggle (always enabled) and Miniflux web path options
-   Removed tab behavior option (always focus existing tab), instant update always on
-   Default refresh interval: 60 minutes (was 5)
-   Custom Multiflux toolbar icons

### Keyboard Shortcuts

| Key                         | Action                             |
| --------------------------- | ---------------------------------- |
| `Left / p / k / q`          | Previous item                      |
| `Right / n / j / e / Space` | Next item                          |
| `m`                         | Mark item read/unread              |
| `t`                         | Mark all older items read          |
| `A`                         | Mark all items read                |
| `u`                         | Toggle unread/all items            |
| `s`                         | Toggle item sort order             |
| `f`                         | Star/unstar item                   |
| `v / w`                     | Open original article in OA window |
| `c`                         | Open comments in new tab           |
| `r`                         | Refresh unread counts              |
| `R`                         | Fetch feeds and refresh feed list  |
| `D`                         | Toggle light/dark theme            |
| `h / ?`                     | Show keyboard shortcuts            |
| `Up/Down`                   | Navigate feeds                     |
| `x`                         | Collapse/uncollapse category       |
| `U`                         | Toggle unread/all feeds            |

## Project Structure

Root-level extension files (static, not in Vite build):
manifest.json — Firefox MV3 manifest (cross-browser)
background.js — Background script (badge, alarms, click handler)
options.html — Options page (inline CSS)
options.js — Options page logic
settings-utils.js — Shared: defaults, URL parse, keywords, connection test
storage-utils.js — Shared: migration from browser.storage.sync → local

src/ (Vite + React 19 enhanced three-pane reader):
index.jsx — Entry: loads settings, renders App
App.jsx — Main reader app (three-pane layout)
FeedBrowser.jsx — Category/feed navigation pane
FeedContextMenu.jsx — Context menus for feeds
ItemBrowser.jsx — Entry list pane
ItemViewer.jsx — Article content pane
ClickNHold.jsx — Long-press utility component
Icon.jsx — Icon wrapper
KeyHelpModal.jsx — Keyboard shortcuts help
runtimeConfig.js — Global config singleton
globalStyles.js — Global styled-components styles
layout.js — Pane layout persistence
readStateStyles.js — Read/unread CSS
themes.js — Light/dark/auto theme
lib/util.jsx — Miniflux API client (fetch + badge refresh)

test/ — Node.js tests (node --test)

## Build & Test Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run the extension in a persistent Firefox profile (build first, then launch)
npm run dev:firefox

# Run the extension in a Chromium window
npm run dev:chromium

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

-   **Source**: all files use the `browser.*` WebExtensions API (Firefox native). No `import browser` statements in source code.
-   **Polyfill for Chrome**: the build script inlines `webextension-polyfill` as an IIFE into `background.js` and `options.js` for Chrome builds only. The IIFE sets `globalThis.browser` as a side effect. Firefox builds are left untouched (native `browser` global).
-   **Manifest generation**: the build script generates browser-specific manifests:
    -   `dist-firefox/manifest.json` — includes `browser_specific_settings`, version_name, cross-browser `background.scripts` + `background.service_worker`
    -   `dist-chrome/manifest.json` — strips Firefox-only keys, `service_worker` only
-   **Output**:
    -   `web-ext-artifacts/multiflux-{version_name}-firefox.zip`
    -   `web-ext-artifacts/multiflux-{version_name}-chrome.zip`
-   **Vite output** is shared — the React app is identical for both browsers, only the manifest + polyfill differ

## Versioning

Plain semver (`0.0.1`, `0.1.0`, `1.0.0`). Same version in `manifest.json`, `package.json`, and `package-lock.json`. The `gecko.version_name` in `manifest.json` mirrors the version (human-readable string on AMO).

-   `npm run build` packages `web-ext-artifacts/multiflux-{version}-{firefox,chrome}.zip`
-   Git tags use `v{version}` format (e.g. `v0.0.1`)
-   Increment per semantic change: patch for fixes, minor for features, major for breaking changes

## Publishing (AMO + Chrome Web Store)

Publishing is **NOT done yet** — accounts and store listings don't exist. The full workflow lives in `DEV/workflow.md` (gitignored, local-only). Summary:

-   **README.md is the store-listing source of truth** — its body is pasted into the AMO description (markdown) and the CWS detailed description, and it contains `TODO:` placeholders for screenshots and store URLs.
-   **Firefox (AMO)**: `npm run build:firefox` then `npm run sign:firefox` (runs `web-ext sign --source-dir=dist-firefox --channel=listed`). AMO requires **source code submission** because the Vite output is minified — pass `--upload-source-code <archive>` (e.g. `git archive --format=zip -o /tmp/multiflux-source.zip HEAD`). Then fill the listing manually on the AMO devhub (summary, description, screenshots 1280x800, category, privacy URL).
-   **Chrome (CWS)**: `npm run build:chrome`, upload `web-ext-artifacts/multiflux-{version}-chrome.zip` to https://chrome.google.com/webstore/devconsole manually (no CLI signing). Requires summary (≤132 chars), screenshots, promo tiles (440x280, 920x680, 1400x560), privacy URL.
-   **Credentials**: `web-ext` reads **`WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET`** from the environment (the `WEB_EXT_` prefix — do NOT use `AMO_JWT_*`). These go in `.env` (gitignored), loaded via `source .env`.
-   **AMO API keys**: generated at https://addons.mozilla.org/developers/addon/api/key/ (the page labels them "JWT issuer"/"JWT secret" — map issuer → `WEB_EXT_API_KEY`, secret → `WEB_EXT_API_SECRET`).
-   **Account URLs**: AMO devhub https://addons.mozilla.org/en-US/developers/addon/, CWS devconsole https://chrome.google.com/webstore/devconsole.
-   **First-submission checklist**: screenshots, CWS tiles, privacy policy URL (raw GitHub link to `privacy-policy.md`), source archive, `npm test` green + `web-ext lint` clean.

## Gitignore Notes

`.gitignore` ignores `.env`, all dotfiles (`.*`), `NOTES.md`, and `/DEV/`. `DEV/workflow.md` (publishing workflow) and `NOTES.md` (personal notes) are intentionally local-only and never committed.

## Upstream Upgrades

See `UPGRADE.md` for the full step-by-step workflow. Quick summary:

1. `git fetch upstream --tags`
2. `git checkout v2.8.0 -b release/2.8.0`
3. `find . -type f -name '*.js' -o -name '*.jsx' ! -path './node_modules/*' -exec sed -i 's/chrome\./browser./g' {} +`
4. Apply manual manifest.json Firefox patch (add `browser_specific_settings`, cross-browser background, rename, `version_name`)
5. Simplify any new callback Promise wrappers
6. `npm test && npx web-ext lint --source-dir=.`
7. Merge into `main`, tag `v{version}`

## Session Save

Saying **"save"** in conversation means:

1. Update this `AGENTS.md` with current progress, decisions, and plan
2. Then run `/compact` to reclaim context

## Conventions

-   Use `browser.*` WebExtensions API (Firefox-preferred, native Promise support)
-   The original `chrome.*` namespace is NOT used — all APIs use `browser.*`
-   `browser.storage.*.get()/.set()/.remove()` return Promises natively — no callback wrappers needed
-   `browser.runtime.lastError` is NOT used — errors are thrown as Promise rejections in Firefox
-   Run `web-ext lint` before every commit — no warnings allowed

## Manifest (cross-browser MV3)

-   Uses both `background.scripts` and `background.service_worker` for cross-browser compatibility:
    -   Firefox: uses `scripts` (background page)
    -   Chrome: uses `service_worker` (service worker)
-   `background.type: "module"` enables ES imports in background scripts (Firefox supports this with `scripts`)
-   `browser_specific_settings.gecko.id` is required for Firefox AMO

## Key Differences from Chrome Extension

-   `chrome.action` → `browser.action` (same API shape)
-   `chrome.storage` → `browser.storage` (native Promises, no callback wrappers)
-   `chrome.runtime.*` → `browser.runtime.*` (native Promises)
-   `chrome.permissions.request` → `browser.permissions.request` (same API shape)
-   Content scripts may need `manifest.json` field `browser_style: false` for custom CSS
-   Firefox requires `web_accessible_resources` to use array-of-objects format (MV3 standard)

## Storage

-   All extension settings and the API token are stored in `browser.storage.local`
-   Nothing is synchronized through Firefox Sync
-   Legacy Chrome Sync settings are migrated to local storage on first run
-   The API token is sent as `X-Auth-Token` header to the Miniflux server

## Architecture

-   **Miniflux API client** (`src/lib/util.jsx`) — wrapped fetch calls to Miniflux server
-   **Background script** (`background.js`) — periodic badge refresh via alarms, toolbar icon click handler
-   **Options page** (`options.html` + `options.js`) — Miniflux server URL and API token configuration
-   **Enhanced reader** (`src/`) — React 19 three-pane RSS reader (categories/feeds, entries, article content)
-   **Badge** — Unread count displayed on toolbar icon, configurable colors and refresh interval
