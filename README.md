# Miniflux Companion

Miniflux Companion is a Chrome/Chromium Manifest V3 extension for a self-hosted Miniflux server. It shows the unread count in the toolbar, opens the standard Miniflux interface by default, and optionally provides a bundled Fluent-style three-pane reader.

## Features

-   Unread toolbar badge with configurable polling interval and colors
-   Standard Miniflux website mode with configurable landing page
-   New-tab or focus-existing-tab behavior
-   Optional enhanced three-pane reader with collapsible and resizable panes
-   Persistent pane widths, contextual search, themes, and configurable item limit
-   Read/unread controls, Mark all as read, bookmarks, and keyboard navigation
-   Direct communication with only the user-configured Miniflux server

## Acknowledgments

The enhanced reader incorporates and significantly modifies code from the
original [Reminiflux](https://github.com/reminiflux/reminiflux) project,
created by Andras Bali.

Sincere thanks for his foundational work.

## Storage and privacy

Non-secret preferences are stored in `chrome.storage.sync`. The API token is stored only in `chrome.storage.local` and is sent directly to the configured Miniflux server as an `X-Auth-Token` header. Reader layout preferences and favicon cache may be stored in page local storage; the API token is never stored there.

See [privacy-policy.md](privacy-policy.md) for the complete privacy policy.

## License

Miniflux Companion is licensed under the GNU General Public License v3.0 or, at your option, any later version. See [LICENSE.md](LICENSE.md).
