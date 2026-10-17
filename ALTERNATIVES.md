# Alternatives — where could Multiflux (or a Miniflux reader) live?

*Decision notes, 2026-10-17. Facts about third-party projects were verified on that date — re-check before relying on them.*

## Context

Multiflux is a personal, AI-assisted reader for a self-hosted [Miniflux](https://miniflux.app/): a three-pane UI with a left-hand, WASD-inspired keyboard model and an optional "3+1" original-article window, packaged as an MV3 extension for Firefox and Chromium.

These notes evaluate where this reader could live long-term, prompted by the discovery that [SmartRSS](https://vinsonguo.github.io/introducing-smartrss) — whose keyboard behaviour originally inspired the question — is **closed source**: only compiled Flutter bundles are published (`VinsonGuo/SmartRSS-Linux`, `VinsonGuo/SmartRSS-Windows` are download-only release repos). There is no source repository to fork.

The options considered:

1. Build a Miniflux frontend as a single binary (Go or Rust).
2. Build a Miniflux frontend as an HTML/CSS/JS app with as few framework dependencies as possible.
3. Package and publish this extension (concern: forced maintenance of a published add-on).
4. Use/fork an existing open-source reader (Fluent Reader, Folo, NewsFlash, …).
5. Switch back to FreshRSS and implement needs as FreshRSS extensions.

## Recommendation (short)

1. **Stay on Miniflux.** Do not switch back to FreshRSS (see §5).
2. **Keep Multiflux as the daily driver, distribute it *unlisted* first.** The feared maintenance burden applies only to *listed* store distribution, and most of it is voluntary. Listed publishing is reversible; do it when an audience is actually wanted.
3. **If you want out of the extension world, port the UI to a static web app** (§2): it is mostly a mechanical port of the current code, served next to Miniflux on the same origin. Keep the framework decision separate — React is not the maintenance problem, distribution is.
4. **Reserve Go for companion tools, not for a UI rewrite** (§1): digests, TTS queues, AI actions — single-binary satellites around Miniflux.
5. **Skip Rust, skip Folo. Don't fork Fluent Reader** unless the rebase tax is acceptable. Newsboat is the cheapest possible keyboard experiment.

The interaction model (q/w/e, space semantics, auto-read filters, 3+1 view) is the real asset and is cheap to re-host; see §"Anti-lock-in".

## Option 1 — Single-binary frontend (Go / Rust)

**Verdict: no for the UI, yes for companions.**

- Rebuilding an already-working UI in another language is the worst effort/value ratio among all options: it trades a maintained artifact for a new one to maintain.
- Go fits the taste (`gowebdev` notes, `seabreeze-rss`, `sleepers-fyne`, Miniflux itself) but its payoff is *server-side*: tools that need cron, filesystem, network, or long-running state. Prior art: [`eleith/miniflux-digest`](https://github.com/eleith/miniflux-digest) (Go, digests from Miniflux entries).
- Candidate companions, in the spirit of `colas-miniflux-tools`: digest generator, TTS queue chaining local engines, AI actions against local models, feed transforms reusing `colas-rss-tools`.
- Rust: no Rust footprint in `~/git`; only pick it if learning Rust *is* the goal of the project.

## Option 2 — Plain HTML/CSS/JS app (few frameworks)

**Verdict: the right "escape hatch" from extension distribution, and it is cheap.**

The current reader is already 95% a web app: `index.html` + a React app that talks **directly** to Miniflux (`fetch` to `/v1` in `App.jsx`, `FeedBrowser.jsx`, `ItemBrowser.jsx`). The extension shell contributes only three things:

| Extension-only piece | Where | Static-app replacement |
|---|---|---|
| Toolbar unread badge | `background.js` (`browser.action`) | lost (acceptable), or keep a thin badge-only extension |
| Original-article window management | `ItemViewer.jsx` (`browser.tabs` / `browser.windows`) | `window.open(url, 'name')` named-window reuse — the same trick already used in `colas-miniflux-tools` custom JS |
| Options page | `browser.runtime.openOptionsPage` | in-page settings route |

Hosting: drop the build into one directory served by the existing reverse proxy next to Miniflux. **Same origin ⇒ direct `/v1` calls, no CORS configuration, no server code, no build step required beyond the existing Vite build.** Gains: works in any browser, including mobile; no store, no review, no manifest churn. Losses: badge and toolbar access; slightly worse "instant access" workflow.

Keep React for the port (de-frameworking is an orthogonal, optional, multi-day project). If wanting a no-framework base, [`electh/ReactFlux`](https://github.com/electh/ReactFlux) (MIT, active) is prior art worth reading first.

## Option 3 — Publish the extension (Firefox AMO / Chrome CWS)

**Verdict: publish _unlisted_ now if desired; _listed_ only when the audience is wanted.**

- The "forced maintenance" fear is mostly a *listed*-distribution cost: review per update, policy churn, and — the real one — **user expectations**. Mozilla does not force update cadence; abandoned listings simply sit there.
- **Firefox unlisted** = one flag change: `web-ext sign --channel=unlisted` (currently `--channel=listed` in `package.json`). Result: auto-signed XPI, no listing, no human review, installable on stock Firefox via *about:addons → Install Add-on From File*. The workflow mechanics are already documented in `DEV/workflow.md`.
- CWS supports unlisted visibility but still applies review; personal Chrome use can stay a load-unpacked profile indefinitely.
- Platform risk profile (2026-10): Chrome **fully removed MV2 on 2026-08-31** — Multiflux is already MV3, so that wave is behind it. Firefox supports both MV2 and MV3 with no announced MV2 end date; the one new requirement encountered so far (`data_collection_permissions`) is already in `manifest.json`.
- Listed publishing remains a valid goal; it is reversible (unlist/abandon at any time).

## Option 4 — Existing open-source readers (ranked by tweakability)

| Project | State (2026-10-17) | Stack | Miniflux | Tweak cost |
|---|---|---|---|---|
| [Newsboat](https://github.com/newsboat/newsboat) | active, 3.9k★ | C++ / TUI | native | **config only** — `bind-key`, macros, external commands |
| [ReactFlux](https://github.com/electh/ReactFlux) | active, 520★, MIT | React web app, static-deployable | web frontend | low; contributes to a maintained codebase |
| [Fluent Reader](https://github.com/yang991178/fluent-reader) | active again (v1.3.1, 2026-10-15), 9.7k★, BSD-3 | Electron / React / TS | via Fever & Google Reader APIs | medium + **rebase tax** on an active upstream |
| [NewsFlash](https://gitlab.com/news-flash/news_flash_gtk) | active (2026-10-17), 588★ | Rust / GTK4 | native, configurable shortcuts built in | high (Rust/GTK4) |
| [Folo](https://github.com/RSSNext/Folo) | 39k★, AGPL-3.0 | Electron monorepo | no (own sync) | not a tweak target |
| [Reminiflux](https://github.com/reminiflux/reminiflux) | stale (last push 2024-05) | JS web app | web frontend | skip |

Notes:

- **Newsboat** deserves a dedicated trial: keybindings are configuration, macros can script behaviour, external commands can invoke local TTS (`phonon2`), and the "3+1" idea maps to terminal-left + a reused browser window right. Zero code, zero maintenance.
- **Fluent Reader** is the easiest *code* for a web developer and is officially listed in Miniflux's third-party apps documentation, but it is not the WASD/3+1 model and forking an actively developed app means periodic rebases.
- **NewsFlash** is the best "just use it" option — it may need no tweaks at all — but modifying it is expensive.

## Option 5 — FreshRSS + extensions

**Verdict: no — it is a regression against the reasons for the Miniflux migration.**

- FreshRSS was left (2026-06) precisely for doing "a lot of things I did not need", at a slower pace.
- FreshRSS extensions are **server-side PHP hooks**: they cannot deliver client-side keyboard/UI changes, which is the actual need.
- Client-side key redefinition is already solved on Miniflux itself through the user setting *Custom JavaScript* (see `colas-miniflux-tools/code/settings-custom-javascript.js`).
- Revisit only if a *server-side* capability gap appears (e.g. a content-processing extension with no Miniflux equivalent); meanwhile the Miniflux API + own tooling covers it.

## Anti-lock-in pattern

The interaction model is the portable asset; the host is not. Isolate:

1. a **keymap module** (the q/w/e + space semantics + auto-read rules), and
2. an **adapter** for the two host-specific capabilities — "open original article in a reused named window" and "open external links in controlled targets".

Then the same model can run in: native Miniflux UI + custom JS, this extension, a static web app, or newsboat macros, without re-deciding anything when the host changes.

## Open questions / next steps

- [ ] Decide: AMO unlisted signing now, listed later?
- [ ] Decide: try a Newsboat keymap in WASD style for a week?
- [ ] Optional: shell-agnostic adapter (`browser.*` vs `window.*`) enabling the static-app port — days, not weeks.
- [ ] Optional: Go companion for digests / TTS queue (`miniflux-digest` as prior art).

## Appendix — facts verified 2026-10-17

- **SmartRSS** — closed source. `github.com/VinsonGuo/SmartRSS-Linux` / `-Windows` are download-only repos; Linux bundle is a compiled Flutter AOT app (`libapp.so`); no Dart source recoverable, no public source repo on GitHub/Gitee.
- **Fluent Reader** — `yang991178/fluent-reader`; BSD-3-Clause; ~9.7k★; v1.3.1 released 2026-10-15; listed on Miniflux's Third-Party Applications page; connects via Fever / Google Reader-compatible APIs.
- **NewsFlash** — `gitlab.com/news-flash/news_flash_gtk`; Rust/GTK4; ~588★; last activity 2026-10-17; native Miniflux; configurable keyboard shortcuts.
- **Newsboat** — `github.com/newsboat/newsboat`; ~3.9k★; last push 2026-10-17; Miniflux support; config-file keybindings.
- **ReactFlux** — `electh/ReactFlux`; MIT; ~520★; pushed 2026-10-17; React web frontend for Miniflux with keyboard shortcuts.
- **miniflux-digest** — `eleith/miniflux-digest`; Go; digests from unread entries, cron-like scheduling, optional AI summaries.
- **Folo** — `RSSNext/Folo`; AGPL-3.0; ~39k★; own sync service; large monorepo.
- **Miniflux** — REST `/v1` API + Fever API + Google Reader-compatible API; third-party app catalogue: <https://miniflux.app/docs/apps.html>.
- **Chrome platform** — Manifest V2 fully removed from the Chrome Web Store on 2026-08-31; MV3 mandatory.
- **Firefox platform** — MV2 and MV3 both supported; no announced MV2 removal; `data_collection_permissions` consent manifest already adopted here.
- **AMO distribution** — `web-ext sign --channel=unlisted` produces a signed XPI without listing or human review; installed via *about:addons → Install Add-on From File*.
