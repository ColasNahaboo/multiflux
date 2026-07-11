# Miniflux Companion

Miniflux Companion is a Chrome/Chromium Manifest V3 extension for a self-hosted Miniflux server. It shows the unread count in the browser toolbar, opens the standard Miniflux interface, and optionally provides an enhanced Fluent-style three-pane reader.

The extension communicates directly with the Miniflux server configured by the user and does not require an intermediary service or external application backend.

## Features

- Unread toolbar badge with configurable polling interval and colors
- Standard Miniflux website mode with configurable landing page
- New-tab or focus-existing-tab behavior
- Optional enhanced three-pane reader
- Collapsible and resizable navigation, entry, and article panes
- Persistent pane widths and layout preferences
- Category and feed navigation
- Feed and category maintenance
- Contextual search
- Read and unread controls
- Mark all visible entries as read
- Automatic read filters using case-insensitive title keywords
- Bookmark support
- Keyboard navigation
- Light, dark, and system themes
- Configurable item limit
- Immediate badge updates after supported reader actions
- Direct communication with the user-configured Miniflux server
- No analytics, advertising, tracking, or remote executable code

## Configuration

The Options page provides settings for:

- Miniflux server URL and API token
- Connection testing and connected account details
- Standard or enhanced reader mode
- Item limit and theme
- Automatic read title keywords
- Polling interval and tab behavior
- Badge colors and live preview

## Enhanced Reader

The enhanced reader provides a three-pane layout for categories and feeds, the entry list, and article content.

Reader actions such as read-state changes, bookmarks, and supported feed or category changes are written back to Miniflux and remain visible in the standard Miniflux interface and other Miniflux clients.

Automatic read filters match user-defined words or phrases against entry titles. Matching is case-insensitive, and matching entries remain stored in Miniflux while being marked read.

## Acknowledgments

The enhanced reader incorporates and significantly modifies code from the
original [Reminiflux](https://github.com/reminiflux/reminiflux) project,
created by Andras Bali.

Sincere thanks for his foundational work.

## Storage and privacy

Non-secret preferences are stored in `chrome.storage.sync`. The API token is stored only in `chrome.storage.local` and is sent directly to the configured Miniflux server as an `X-Auth-Token` header.

Reader layout preferences and favicon data may be stored locally in the browser. The API token is never stored in page local storage.

Miniflux Companion does not collect, sell, or share user data with the developer, advertisers, analytics providers, or other third parties. It uses no analytics, advertising, tracking, remote executable code, or developer-operated intermediary server.

See [privacy-policy.md](privacy-policy.md) for the complete privacy policy.

## License

Miniflux Companion is licensed under the GNU General Public License v3.0 or, at your option, any later version. See [LICENSE.md](LICENSE.md).
