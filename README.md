# Multiflux

Keyboard-first three-pane web reader for your self-hosted
[Miniflux](https://miniflux.app/) server.

## What it is

A static web app you deploy next to your Miniflux instance (e.g. at
`https://rss.example.org/mf/`). It talks to the Miniflux REST API directly from
the browser using an API token kept in a hand-edited `config.yaml` on your
server — no backend, no accounts, no store, no build services.

-   Three panes: categories/feeds → entry list → article content
-   Global Unread pseudo-feed honoring Miniflux's "hide globally" flag
-   Vim-style keyboard navigation (`q/e/w/?` aliases on top of `hjkl`)
-   Original-Article mode: articles open in a reusable side window (or tab)
-   Batch mark-read with 30s undo toasts, auto-read by title keywords
-   Light/dark/auto themes; sort and category order from server preferences

## Quick start

1.  `npm install && npm run build`
2.  Copy `dist/*` to a directory served by the web server in front of your
    Miniflux (same host or any origin — the API is CORS-enabled).
3.  Copy `config.example.yaml` to `config.yaml` next to `index.html`, fill in
    `url` and `apiToken` (Miniflux → Settings → API).
4.  **Protect `config.yaml`** (Basic auth and/or LAN-only) — it contains the
    token. See `AGENTS.md` for an Apache example.
5.  Open the page.

## Development

```bash
npm test              # node --test
npm run dev           # vite dev server
npm run format:check  # prettier
```

## History

v1.x was a Firefox/Chrome extension (a fork of
[miniflux-companion](https://codeberg.org/gbcox/miniflux-companion), GPL v3).
The extension was retired in favor of this web app; its code lives on in the
`multiflux-ext` archive and in git history up to `v1.0.0`.

## License

GPL-3.0-or-later © Colas Nahaboo (upstream: Gerald Cox)
