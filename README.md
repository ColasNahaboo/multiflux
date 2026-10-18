# Multiflux

Keyboard-first three-pane web reader for your self-hosted
[Miniflux](https://miniflux.app/) server.

## What it is

A static web app you deploy next to your Miniflux instance (e.g. at
`https://rss.example.org/mf/`). The browser talks to the Miniflux REST API
directly using an API token kept in a hand-edited `config.yaml` on your
server — no backend, no accounts, no store, no telemetry.

-   Three panes: categories/feeds → entry list → article content
-   Global Unread pseudo-feed honoring Miniflux's "hide globally" flag
-   Vim-style keyboard navigation (`hjkl` plus `q/e/?` aliases)
-   Original-Article mode: articles open in a reusable side window whose
    geometry you control, or in a new tab
-   On-demand full-text extraction (`w`) and per-feed auto-fetch (`W`), saved
    back to Miniflux
-   Batch mark-read with 30s undo toasts, auto-read by title keywords
-   Light/dark/auto themes; sort and category order from server preferences

## Requirements

-   A Miniflux instance (v2) with the API enabled (Settings → API) — you need
    an API token
-   Any static web server (Apache, nginx, Caddy…) able to serve a directory
    of files; Node.js ≥ 20 only to build

> The Miniflux API sends `Access-Control-Allow-Origin: *`, so the app works
> whether you host it on the same origin as Miniflux or anywhere else.

## Installation

1.  **Build and deploy** with the provided `INSTALL` script (runs
    `npm run build`, then rsyncs `dist/` — with `--delete` — to the target
    directory):

    ```bash
    git clone https://github.com/ColasNahaboo/multiflux && cd multiflux
    npm install
    ./INSTALL /var/www/multiflux
    ```

    The destination can also come from the `MULTIFLUX_INSTALL` environment
    variable, or from a `.install-dir` file in the repo (one path, gitignored)
    so repeated upgrades are just `./INSTALL`:

    ```bash
    echo /var/www/multiflux > .install-dir   # remember it
    MULTIFLUX_INSTALL=/var/www/multiflux ./INSTALL   # one-off override
    ```

    Precedence: argument → `MULTIFLUX_INSTALL` → `.install-dir`. The target
    may be any path rsync understands, including remote (`host:/path`).

2.  **Serve it** from a directory reachable under some path such as `/mf/`.
    For Apache behind which Miniflux is reverse-proxied, this goes **before**
    the catch-all `ProxyPass`:

    ```apache
    Alias /mf /var/www/multiflux
    <Directory /var/www/multiflux>
        Require all granted
    </Directory>

    ProxyPass /mf !          # mandatory: exempt /mf from the Miniflux proxy
    ProxyPass / http://127.0.0.1:8080/
    ```

3.  **Configure** — copy `config.example.yaml` to a file served as
    `/mf/config.yaml`. Keep it **outside** the deployed directory (e.g.
    `/etc/multiflux/config.yaml` with its own `Alias`) so upgrades can never
    delete it:

    ```yaml
    url: https://rss.example.org
    apiToken: <your Miniflux API token>
    # theme: auto | light | dark
    # oaMode: window | tab
    # oaGeometry: right | half | x,y,w,h
    # maxItems: 100
    # refresh: 60
    ```

4.  **Protect `config.yaml`** — it contains the API token. Restrict it to
    your LAN, or put it behind Basic auth (`RequireAny` of both is handy):

    ```apache
    Alias /mf/config.yaml /etc/multiflux/config.yaml
    <Directory /etc/multiflux>
        Require all granted
    </Directory>
    <Location /mf/config.yaml>
        AuthType Basic
        AuthName "Multiflux"
        AuthUserFile /etc/apache2/.multiflux.htpasswd
        <RequireAny>
            Require ip 192.168.1.0/24
            Require valid-user
        </RequireAny>
    </Location>
    ```

5.  Open `https://rss.example.org/mf/`. The page loads its config at startup;
    reload after any edit.

## Upgrading

```bash
git pull
npm install && npm test
./INSTALL   # destination from .install-dir / MULTIFLUX_INSTALL
```

Nothing else: settings live in `config.yaml` (outside the synced directory),
per-browser state (theme override, pane sizes, always-open feeds) lives in
`localStorage`. This also stores per-feed auto-full-text preferences and a
bounded cache of entries already fetched. There is no database and no server
component to migrate.
Check the release notes for new `config.yaml` keys.

## Keyboard shortcuts

| Key                         | Action                                        |
| --------------------------- | --------------------------------------------- |
| `Left / p / k / q`          | Previous item                                 |
| `Right / n / j / e / Space` | Next item                                     |
| `m`                         | Mark item read/unread                         |
| `t`                         | Mark all older items read (with undo)         |
| `A`                         | Mark all items read (with undo)               |
| `u` / `U`                   | Toggle unread/all items / feeds               |
| `s`                         | Toggle item sort order                        |
| `f`                         | Star/unstar item                              |
| `v`                         | Open original article in OA window            |
| `w`                         | Fetch and save full article content           |
| `V`                         | Always open original article for this feed    |
| `W`                         | Toggle auto-fetch on first view for this feed |
| `c`                         | Open comments in new tab                      |
| `r` / `R`                   | Refresh counts / fetch feeds                  |
| `Shift+D`                   | Toggle light/dark theme                       |
| `h / ?`                     | Keyboard help                                 |
| `Up/Down`                   | Navigate feeds                                |
| `x`                         | Collapse/uncollapse category                  |

## History

v1.x was a Firefox/Chrome extension (a fork of
[miniflux-companion](https://codeberg.org/gbcox/miniflux-companion), GPL v3).
The extension was retired in favor of this web app; its code lives on in the
`multiflux-ext` archive and in git history up to `v1.0.0`.

## License

GPL-3.0-or-later © Colas Nahaboo (upstream: Gerald Cox)
