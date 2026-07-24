# Multiflux

Multiflux is a Firefox and Chrome/Chromium Manifest V3 extension for Miniflux. It provides a modern three-pane enhanced interface similar to [Fluent Reader](https://hyliu.me/fluent-reader/), and shows the unread count in the browser toolbar.

The extension communicates directly with the Miniflux server configured by the user and does not require an intermediary service or external application backend.

![Co-Designed with AI](icons/AI-badge.png) This repository is designed, tested and used by me, Colas Nahaboo, a human hobbyist in my personal time with implementation mostly by AI (Opencode and DeepSeek V4 pro) forked from the nice [Miniflux Companion](https://codeberg.org/gbcox/miniflux-companion).

## Installation

**Prerequisites:** a [Miniflux](https://miniflux.app/) instance with an API token (Miniflux → Settings → API Keys → Create).

### Firefox

1. Download the latest `.xpi` from [Releases](https://github.com/colas/multiflux/releases) (drag the file onto `about:addons`), or load temporarily via `about:debugging` → This Firefox → Load Temporary Add-on → select `dist-firefox/manifest.json`.

### Chrome / Chromium

1. Open `chrome://extensions`, enable **Developer mode**
2. Click **Load unpacked** and select the `dist-chrome/` directory

### Initial setup

1. Click the Multiflux toolbar icon, then the gear icon (or right-click → Options)
2. Enter your Miniflux server URL and API token, click **Test connection**
3. Click **Save changes**

The toolbar badge shows the unread count (refreshes every 60 minutes by default).

## Features

- Unread toolbar badge with configurable polling interval and colors
- Enhanced three-pane reader
- Collapsible and resizable navigation, entry, and article panes
- Persistent pane widths and layout preferences
- Category and feed navigation
- Feed and category maintenance
- Contextual search
- Read and unread controls
- Mark all visible entries as read
- Mark all entries in feed older than the current item as read
- Undo of the "Mark all" operations
- Original article: open in a new window to the right or in a new tab
- Automatic read filters using case-insensitive title keywords
- Bookmark support
- Keyboard navigation
- Light, dark, and system themes
- Configurable item limit
- Immediate badge updates after supported reader actions
- Direct communication with the user-configured Miniflux server
- No analytics, advertising, tracking, or remote executable code

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `Left / p / k / q` | Previous item |
| `Right / n / j / e / Space` | Next item |
| `m` | Mark item read/unread |
| `t` | Mark all items older than current as read |
| `A` | Mark all visible items as read |
| `u` | Toggle unread/all items |
| `s` | Toggle item sort order (newest/oldest) |
| `f` | Star/unstar item |
| `v / w` | Open original article (OA window or tab) |
| `c` | Open comments in new tab |
| `r` | Refresh unread counts |
| `R` | Fetch feeds and refresh feed list |
| `D` | Toggle light/dark theme |
| `h / ?` | Show keyboard shortcuts |
| `Up / Down` | Navigate feeds |
| `x` | Collapse/uncollapse category |
| `U` | Toggle unread/all feeds |

### Motivations
I wanted a RSS reader that:
- was using Miniflux as its backend, as I love its architecture, especially the Go single binary.
- was simple to host and maintain (no docker, database, exotic frameworks, many dependencies,...)
- has a modern UI (unlike Miniflux), but also efficient use of the keyboard (like Miniflux)
- uses the left hand to navigate, freeing the right hand for the mouse, and natural for PC videogames players (close to the [WASD standard](https://www.pcgamer.com/how-wasd-became-the-standard-pc-control-scheme/))
- takes advantage of modern ultra-wide screen, by adding the original article view as a browser window in full view on the right, instead of hidden in another tab. The fact that this window is a real first class window is important, to be able to use the full power of your actual browser.
- allow me to implement usability enhancements each time I wanted to [scratch an itch](https://opensource.com/article/17/4/itch-to-scratch-model-user-problems) (hence my use of AI).

### Differences with Miniflux Companion
- Available as a Firefox extension in addition to Chrome/Chromium.
- Left-hand keyboard navigation (WASD-inspired `q`/`w`/`e` for prev/view/next, see table above).
- `t` key: mark older items as read, `?` for help (in addition to `h`).
- Undo toast for batch mark-read operations.
- "3+1" view: three-pane layout plus optionally a full browser window to the right for the original article, or a new tab on narrower screens.
- Respects Miniflux server entry sort direction and category ordering.

## Configuration

The Options page provides settings for:

- Miniflux server URL and API token
- Connection testing and connected account details
- Item limit and theme
- Automatic read title keywords
- Polling interval and "open original article" tab or window behavior
- Badge colors and live preview

## Reader

The enhanced reader provides a three-pane layout for categories and feeds, the entry list, and article content.

Reader actions such as read-state changes, bookmarks, and supported feed or category changes are written back to Miniflux and remain visible in the standard Miniflux interface and other Miniflux clients.

Automatic read filters match user-defined words or phrases against entry titles. Matching is case-insensitive, and matching entries remain stored in Miniflux while being marked read.

## Building from Source

```bash
npm install
npm run build          # both browsers (dist-firefox/ and dist-chrome/)
npm run build:firefox  # Firefox only
npm run build:chrome   # Chrome / Chromium only
npm test               # run tests
```

The same codebase produces both Firefox and Chrome extensions via [webextension-polyfill](https://github.com/mozilla/webextension-polyfill). The build script (`build-extension.mjs`) generates browser-specific manifests and packages signed `.zip` files in `web-ext-artifacts/`.

## Acknowledgments

- The enhanced reader incorporates and significantly modifies code from the
original [Reminiflux](https://github.com/reminiflux/reminiflux) project,
created by Andras Bali.
- The Multiflux code is a fork of [Miniflux Companion](https://codeberg.org/gbcox/miniflux-companion) by Gerald Cox, without which this project could not have started.

## Storage and privacy

All extension settings and connected-account details, including the server URL and API token, are stored in `browser.storage.local`. Nothing is synchronized through browser sync. Existing synchronized settings from older versions are migrated to local extension storage and removed from synchronized storage only after the local write succeeds. The API token is sent directly to the configured Miniflux server as an `X-Auth-Token` header.

Reader layout preferences and favicon data may be stored locally in the browser. The API token is never stored in page local storage.

The developer does not receive or collect user data. Multiflux communicates only with the Miniflux server configured by the user and with external share handlers explicitly invoked by the user, such as an email application or Telegram. It uses no analytics, advertising, tracking, remote executable code, or developer-operated intermediary server.

## Chrome Web Store permission justifications

- `storage`: Stores all extension settings, the API token, and connected-account details locally in the browser. It also performs a one-time migration of settings saved by older versions from Chrome Sync to local extension storage; nothing remains synchronized after migration.
- `alarms`: Schedules periodic refreshes of the unread-entry count so the toolbar badge stays current at the polling interval selected by the user.
- `tabs`: Opens or focuses the Multiflux reader tab when the toolbar icon is clicked.
- Optional host access: Connects directly to the user-configured Miniflux server after the user grants access to that origin.

See [privacy-policy.md](privacy-policy.md) for the complete privacy policy.

## Getting Help

- **Issues**: Report bugs or request features on the [GitHub issues page](https://github.com/colas/multiflux/issues)
- **Keyboard shortcuts**: Press `?` or `h` in the reader to see all shortcuts
- **Configuration**: Right-click the extension icon → Options, or click the gear icon in the reader

## License

© Colas Nahaboo, 2026.
Multiflux is licensed under the GNU General Public License v3.0 or, at your option, any later version. See [LICENSE.md](LICENSE.md).
