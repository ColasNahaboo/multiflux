# Miniflux Companion — Privacy Policy

Miniflux Companion does not collect, transmit to third parties, sell, or share personal data. All extension functionality runs locally in the browser and communicates only with the Miniflux server configured by the user.

## Data storage

The Miniflux server URL, refresh interval, badge colors, opening behavior, enhanced-reader preference, item limit, and theme are stored with `chrome.storage.sync` and may be synchronized by Chrome according to the user's browser and account settings.

The Miniflux API token is stored only with `chrome.storage.local`. Older installations may have stored the token under the synchronized `password` key; the extension migrates that value to local storage and removes the synchronized copy only after the local write succeeds.

Reader layout, filtering, sorting, collapsed-state preferences, and a favicon cache may be stored in the bundled reader's local storage. The API token is never written to page local storage.

## Network access

The extension communicates directly with the user-configured Miniflux server to retrieve feeds, articles, unread counts, icons, and to perform requested article actions. It does not operate an external service and does not use analytics, tracking, advertising, cookies, or remote executable code.

## Permissions

-   `storage` saves extension settings and the API token.
-   `alarms` periodically refreshes the unread count.
-   `tabs` opens or focuses Miniflux and bundled-reader tabs.
-   Optional host permission allows API access only after the user authorizes the configured Miniflux origin.

## Contact

Questions about this policy may be sent to **gbcox@bzb.us**.
