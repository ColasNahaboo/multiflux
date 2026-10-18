# Multiflux

Three-pane web reader for a self-hosted [Miniflux](https://miniflux.app/)
server, with a keyboard-first (Vim-style) interaction model.

v1.x was published as a Firefox/Chrome extension; **the extension is retired**
(Nov 2026). The full extension codebase is preserved in the sibling checkout
`../multiflux-ext` (git history also intact here up to the port commit).
The web app reuses ~95% of the extension's React UI.

Origin: fork of https://codeberg.org/gbcox/miniflux-companion (GPL v3),
heavily modified. License: GPL-3.0-or-later.

## Architecture

```
Browser ──https──► rss.nahaboo.org (Apache on m)
                     ├─ /mf/*  ──► static files in /www/multiflux
                     └─ /*     ──► Miniflux 127.0.0.1:8080
Browser JS calls the Miniflux REST API DIRECTLY (cross-origin fetch with
X-Auth-Token). Miniflux sends Access-Control-Allow-Origin: * on /v1, so no
proxy is needed. The app never talks to Apache except for its own files.
```

Key facts (verified against Miniflux source + live server, 2026-10):

-   `/v1` accepts ONLY `X-Auth-Token` or HTTP Basic — never session cookies
    (session-cookie passthrough is impossible; CSRF middleware covers the HTML
    UI only).
-   `/v1` sends `Access-Control-Allow-Origin: *` allowing `X-Auth-Token`, so
    any origin can call the API with a token. This is why no Go backend exists.
-   The token lives in `/etc/multiflux/config.yaml` (served at
    `/mf/config.yaml`), fetched at startup (`src/lib/config.js` parses a
    minimal YAML subset — flat keys, block lists, comments). Settings are
    edited by hand; there is NO settings page.
-   `config.yaml` is protected by Apache: `<RequireAny>` LAN IP OR Basic auth
    (see DEPLOY below). Theme override persists in `localStorage`
    (`multiflux_theme`); always-open-original and auto-full-text feed IDs too
    (`always_open_original_feeds`, `always_full_text_feeds`), plus a bounded
    per-entry content-signature cache (`full_text_fetched_entries`).

## Project Structure

```
index.html            Vite entry
src/index.jsx         Loads config.yaml, renders App
src/App.jsx           Three-pane app (feeds / entries / article)
src/FeedBrowser.jsx   Navigation pane
src/FeedContextMenu.jsx
src/ItemBrowser.jsx   Entry list pane
src/ItemViewer.jsx    Article pane (OA window, share buttons)
src/KeyHelpModal.jsx  Keyboard shortcuts help
src/lib/util.jsx      Miniflux API client (fetch wrapper)
src/lib/settings.js   Keyword matching, auto-read, URL normalize, unread totals
src/lib/entryContent.js Miniflux full-text endpoint and entry content merge
src/lib/alwaysFullText.js Per-feed auto-fetch preference and fetched-entry cache
src/lib/config.js     config.yaml fetch + minimal YAML parser + defaults
src/lib/host.js       Host adapter: OA window reuse (window.open named), theme storage
src/lib/alwaysOpen.js Always-open-original feed IDs (localStorage)
src/runtimeConfig.js  Config singleton
src/layout.js         Pane layout persistence (localStorage)
src/themes.js         Light/dark/auto themes
public/icons/         Share-button icons (copied to dist by Vite)
test/                 node --test suites (config, settings, host geometry, feed modes)
config.example.yaml   Documented sample config
```

## Build & Test Commands

```bash
npm install
npm test              # node --test
npm run format:check  # prettier
npm run build         # vite build → dist/
npm run deploy        # build + rsync --delete dist/ → m:/www/multiflux/
npm run dev           # vite dev server (needs a config.yaml in dist/ or public/)
```

## Configuration (`config.yaml`)

On `m`: `/etc/multiflux/config.yaml` (edit by hand, reload page to apply;
gitignored; see `config.example.yaml` for a documented sample). Keys: `url`,
`apiToken` (required); `theme`
(auto|light|dark), `oaMode` (window|popdecor|tab; popdecor requests browser
chrome via legacy window features — Firefox only, Chrome keeps the popup
undecorated), `oaGeometry` (`right` = right of
reader same size [default], `half` = right screen half, or explicit
`x,y,w,h` pixels — negative x for a left monitor), `maxItems` (10..1000),
`refresh` (minutes, 0=off), `autoReadTitleKeywords` (block list). Reload the
page to apply edits. The settings gear button just reloads.

## Deploy (host `m`)

-   App dir: `/www/multiflux` — pure rsync target of `dist/` (`--delete` safe)
-   Config: `/etc/multiflux/config.yaml` (root:www-data 640), **outside** the
    rsync target so deploys can never delete it; edit with emacs, then reload
    the browser page.
-   Apache `rss.conf` additions inside the 443 vhost, BEFORE the catch-all
    `ProxyPass /`. The `/mf/config.yaml` Alias must come **before** `Alias
/mf` (first-match wins) and needs its own `<Directory>` grant:

```apache
    # Multiflux web app (static files; browser calls /v1 cross-origin directly)
    # config.yaml holds the API token — kept outside the rsync target,
    # LAN or Basic auth required
    Alias /mf/config.yaml /etc/multiflux/config.yaml
    <Directory /etc/multiflux>
        Options None
        AllowOverride None
        Require all granted
    </Directory>
    <Location /mf/config.yaml>
        AuthType Basic
        AuthName "Multiflux"
        AuthUserFile /etc/apache2/.multiflux.htpasswd
        <RequireAny>
            Require ip 10.0.0.0/8
            Require valid-user
        </RequireAny>
    </Location>

    Alias /mf /www/multiflux
    <Directory /www/multiflux>
        Require all granted
    </Directory>

    # BEFORE the catch-all ProxyPass, exempt /mf from proxying to Miniflux:
    ProxyPass /mf !
    ProxyPass / http://127.0.0.1:8080/
```

-   URL: https://rss.nahaboo.org/mf/ (deployed 2026-10-17, verified E2E)
-   **`ProxyPass /mf !` is mandatory** — without it the catch-all proxies
    `/mf` to Miniflux, which 302s to its login page.
-   Basic-auth user `colas` in `/etc/apache2/.multiflux.htpasswd` (password =
    Colas's personal one, same as `.colas.pass`). Verified: 401 without auth
    off-LAN, 200 with; 200 from LAN without prompt.
-   `config.yaml` is served as `application/yaml`; the loader rejects HTML
    bodies (defensive against misroutes).

## Keyboard Shortcuts

| Key                         | Action                                        |
| --------------------------- | --------------------------------------------- |
| `Left / p / k / q`          | Previous item                                 |
| `Right / n / j / e / Space` | Next item                                     |
| `m`                         | Mark item read/unread                         |
| `t`                         | Mark all older items read                     |
| `A`                         | Mark all items read                           |
| `u`                         | Toggle unread/all items                       |
| `s`                         | Toggle item sort order                        |
| `f`                         | Star/unstar item                              |
| `v / d`                     | Open original article in OA window            |
| `a`                         | Open original article in a new tab            |
| `w`                         | Fetch and save full article content           |
| `V`                         | Always open original article for this feed    |
| `W`                         | Toggle auto-fetch on first view for this feed |
| `c`                         | Open comments in new tab                      |
| `r`                         | Refresh unread counts                         |
| `R`                         | Fetch feeds and refresh feed list             |
| `Shift+D`                   | Toggle light/dark theme                       |
| `h / ?`                     | Show keyboard shortcuts                       |
| `Up/Down`                   | Navigate feeds                                |
| `x`                         | Collapse/uncollapse category                  |
| `U`                         | Toggle unread/all feeds                       |

## Features beyond upstream miniflux-companion

-   Global Unread pseudo-feed (filters by `hide_globally`)
-   OA (Original Article) mode: reused named window (`multiflux-oa`) or new
    tab, geometry via `oaGeometry` (see `oaFeatures()` in `src/lib/host.js`,
    unit-tested; headless Chromium ignores features — verify placement in a
    real browser only)
-   Vim-style aliases (q/k prev, e/j next, w fetch full text, ? help)
-   `W` toggles per-feed auto-fetch; content is fetched and persisted on first view
-   `t` mark-all-older-as-read + undo toasts for `t`/`A` (30s)
-   Entry sort direction / category order from server prefs
-   Auto-read by title keywords

## Conventions

-   React 19 + styled-components + Vite; no router, no state library
-   All Miniflux access through `apiCall()` in `src/lib/util.jsx`
-   No `browser.*` / WebExtension APIs anywhere — host-specific behavior goes
    through `src/lib/host.js`
-   TDD: node --test first for lib/ logic; E2E via playwright-cli against a
    local static server + real Miniflux API (temp config.yaml in dist/, never
    committed)
-   Run `npm test` and `npm run format:check` before committing
-   Prettier: tabs, single quotes (see .prettierrc)

## Versioning

Plain semver in `package.json` (manifest.json is gone). Git tags `v{version}`.
The extension line ended at v1.0.0; the web app restarts at v2.0.0
(currently `2.0.0-dev.1`). README.md is user-facing (install/upgrade); this
file is the maintainer/agent guide.

## History / Upstream

-   Extension-era docs (AMO/CWS publishing, upstream-upgrade workflow,
    manifest notes): see `../multiflux-ext/AGENTS.md` and git history ≤ v1.0.0.
-   ALTERNATIVES.md (repo root) holds the 2026-10 decision analysis that led
    here (static web app over extension/desktop/fork options).
