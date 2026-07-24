# Multiflux

Multiflux  is a Firefox and a Chrome/Chromium Manifest V3 extension for a Miniflux instance. It provides a nice modern 3-panes-plus-one enhanced interface similar to [Fluent Reader](https://hyliu.me/fluent-reader/), and shows the unread count in the browser toolbar, opens the standard Miniflux interface. It is a fork of the nice [Miniflux Companion](https://codeberg.org/gbcox/miniflux-companion).

The extension communicates directly with the Miniflux server configured by the user and does not require an intermediary service or external application backend.



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

All extension settings and connected-account details, including the server URL and API token, are stored in `chrome.storage.local`. Nothing is synchronized through Chrome Sync. Existing synchronized settings from older versions are migrated to local extension storage and removed from synchronized storage only after the local write succeeds. The API token is sent directly to the configured Miniflux server as an `X-Auth-Token` header.

Reader layout preferences and favicon data may be stored locally in the browser. The API token is never stored in page local storage.

The developer does not receive or collect user data. Miniflux Companion communicates only with the Miniflux server configured by the user and with external share handlers explicitly invoked by the user, such as an email application or Telegram. It uses no analytics, advertising, tracking, remote executable code, or developer-operated intermediary server.

## Chrome Web Store permission justifications

- `storage`: Stores all extension settings, the API token, and connected-account details locally in the browser. It also performs a one-time migration of settings saved by older versions from Chrome Sync to local extension storage; nothing remains synchronized after migration.
- `alarms`: Schedules periodic refreshes of the unread-entry count so the toolbar badge stays current at the polling interval selected by the user.
- `tabs`: Opens or focuses Miniflux and bundled-reader tabs according to the user's configured behavior.
- Optional host access: Connects directly to the user-configured Miniflux server after the user grants access to that origin.

See [privacy-policy.md](privacy-policy.md) for the complete privacy policy.

## License

Miniflux Companion is licensed under the GNU General Public License v3.0 or, at your option, any later version. See [LICENSE.md](LICENSE.md).
