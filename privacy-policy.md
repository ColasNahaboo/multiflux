# Multiflux — Privacy Policy

Miniflux Companion does not transmit user data to or collect user data for the developer, and it does not sell or share personal data. Extension functionality runs locally in the browser. The extension communicates only with the Miniflux server configured by the user and with external share handlers explicitly invoked by the user, such as an email application or Telegram.

## Data storage

All extension settings and connected-account data are stored in local extension storage with `chrome.storage.local`. This includes the Miniflux server URL, API token, connected-account username, user ID and server hostname, refresh interval, badge colors, opening and tab behavior, reader settings, item limit, theme, and automatic-read keywords. Nothing is synchronized through Chrome Sync.

Older versions stored some settings, including a legacy API token under the `password` key, in synchronized storage. The extension migrates those values once, preserves existing local values, and removes the synchronized copies only after any required local write succeeds.

Reader layout, filtering, sorting, collapsed-state preferences, and a favicon cache may be stored in the bundled reader's local storage. The API token is never written to page local storage.

## Network access

The extension communicates directly with the user-configured Miniflux server to retrieve feeds, articles, unread counts, icons, and to perform requested article actions. Feed and article content is processed only to provide the extension's reading, filtering, navigation, and sharing features.
When the user invokes an external share action, the extension passes the selected article title and URL to that handler. It does not operate an external service and does not use analytics, tracking, advertising, cookies, or remote executable code.

## Permissions

-   `storage` locally saves all extension settings, the API token, and connected-account details, and supports one-time migration from older synchronized storage.
-   `alarms` schedules unread-count refreshes at the user-selected polling interval so the toolbar badge stays current.
-   `tabs` opens or focuses Miniflux and bundled-reader tabs.
-   Optional host permission allows API access only after the user authorizes the configured Miniflux origin.

## Contact

Questions about this policy may be sent to **colas@nahaboo.net**.
