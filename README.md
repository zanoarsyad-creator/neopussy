# NeoPussy — WebKitty clone + alternate skin

A local mirror of **WebKitty v2.0** (PS4 exploit host by ArabPixel) plus a redesigned
front-end called **NeoPussy**. The exploit engine, payload library and all JavaScript
logic are the original files; only the HTML skeleton and a skin stylesheet are new.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | **Simple mode / 1-klik** — the only user-facing page, one big button |
| `cache.html` | Internal firmware-caching flow (AppCache, PS4 only) — not a UI |
| `exploit.html` | Internal barebone exploit loader — not a UI |

The former `index-neo.html` and `index-original.html` variants have been removed;
`index.html` is the sole entry point. `cache.html` and `exploit.html` are kept only
because the original engine redirects/iframes them internally.

## Run it locally

The page needs HTTP (it loads scripts and payloads with `XMLHttpRequest`), so `file://` will not work.

```powershell
cd webkitty-clone
python serve.py
```

`serve.py` is `python -m http.server` plus the one header AppCache needs:
`.manifest` files are served as `text/cache-manifest` (plain `http.server` sends
`application/octet-stream`, which makes the PS4 show **"Cache error"**). It also prints
the LAN URL to open on the PS4.

Then open <http://localhost:8099/> (same as `/index.html`).

### Using it on a PS4

1. Keep the HTTP server running on a PC/phone on the same network.
2. On the PS4 browser, open `http://<your-pc-ip>:8099/`
   (use plain **http://**, not https — payload delivery needs it).
3. Just press **JAILBREAK + GOLDHEN** and leave the browser open. HEN selection
   (GoldHEN or PS4HEN) is automatic.

> When a non-PS4 device opens the page from a LAN IP, the host script intentionally
> switches to "remote payload sender" mode (IP + firmware selector, payload list only).
> That is original WebKitty behaviour, not a bug in the skin.

## Firmware caching (`cache.html`)

The PS4 is redirected to `cache.html` once when it has no AppCache. It loads a
firmware-specific page in a hidden iframe, whose `<html manifest="...">` downloads the
file list for that firmware.

For this to work:

1. **Every `.manifest` under `includes/caches/manifest/` must exist** (13 files) and
   every URL listed inside must return HTTP 200. The mirror was missing the whole
   `manifest/` directory plus 40 referenced binaries/scripts; those are now restored.
2. **The server must send `Content-Type: text/cache-manifest`** for `.manifest`.
   - Easiest: use `python serve.py` (see above).
   - Apache: `.htaccess` in the repo root already has `AddType text/cache-manifest .manifest .appcache`.
   - IIS: `web.config` in the repo root already adds the `mimeMap`.
   - nginx: add `location ~* \.(manifest|appcache)$ { types { } default_type text/cache-manifest; }`.
3. The manifests now list only `index.html` plus both `includes/css/neo/*.css` files,
   so the single homepage and its skin are cached. The version comment was bumped
   (`neofix 9`) to force PS4 browsers to refresh after the recent page fixes.

`iframe_cache.js` now reports the actual cause on screen (wrong MIME type vs. a 404 in
the manifest) and handles the `obsolete` event; `cache.html` has a 30-second watchdog
so the console never stays frozen on "Preparing...".

> AppCache was removed from current Chrome/Edge/Firefox. On a desktop browser
> `cache.html` will legitimately say *"applicationCache is not available in this
> browser"* — that message is expected there; the real target is the PS4 browser.

## One-click mode (`index.html`, homepage)

Open `http://<your-pc-ip>:8099/` on the PS4. It shows a single
**JAILBREAK + GOLDHEN** button, a firmware/HEN line and a short live log.

- The full NeoPussy page still runs underneath the overlay, so **all original engine
  IDs, handlers and script order are untouched** — this is only a visual layer.
- GoldHEN (latest supported version) is preselected automatically. On firmwares where
  GoldHEN is unavailable (< 5.05 or > 14.02) it switches to PS4HEN by itself.
- The button calls the same `chooseHEN()` + `jailbreak()` path as the original START
  button, so auto-retry/userland reloads behave exactly as before.
- The status line follows the original `#console` output and reports success/failure.
- There are no navigation links to other pages — `index.html` is the only entry point.
- **Original UI is never visible:** an inline critical-CSS cover sits above the whole
  original page from the very first paint, and the one-click card is the only layer
  that receives clicks. The untouched DOM still exists underneath for the engine.
- **Original engine behaviour is preserved.** The full payload library is rendered,
  `loadSettings()` runs completely, and exploit-chain selection is left to
  `firmware.js` / `checkFw.js` exactly like the upstream site. On FW 11.00 that means
  the default **SlopKit Lapse** chain — the same chain that works on the original
  WebKitty host. Earlier experiments with preloading (XHR or `<link rel=preload>`),
  aborting AppCache, skipping payload rendering and forcing CSSFontFace on 11.00 all
  caused GoldHEN to fail on PS4 and were removed.
- **Build 8 includes a one-time localStorage migration** (`neopussy-chain-reset-8`):
  firmware 11.00/11.02 devices that still have the old forced `CSSFontFace` chain
  stored are switched back to the upstream default once, then never touched again.
- The card reports success **only** when an actual payload-launch marker appears
  (`PAYLOAD-RUNNING`, `PAYLOAD-ALIVE`, `Created bin thread`, `bin returned`).
  Upstream words like `...succeeded...`, `JAILBROKEN` and even `===END===` are
  root/userland-stage messages and are no longer treated as completion.
- **Auto-close (build 10):** once that launch marker is seen on a real PS4, the card
  shows "GoldHEN aktif. Menutup browser PS4..." and closes the browser automatically
  (a few `window.close()` variants are tried for firmware builds that reject the
  plain call). Desktop preview never closes, and `?noautoclose=1` keeps the page open
  for diagnostics.
- **Build 10 HTTPS fix:** opening the GitHub Pages URL on a PS4 no longer redirects
  to `http://webkitty.arabpixel.net`. The upstream HTTPS→HTTP redirect was removed;
  the card now shows a short hint instead. Payload delivery still requires a plain
  HTTP LAN host such as `http://<IP-PC>:8099/`.

## How the redesign works

- `includes/css/neo/neo.css` is loaded **after** the original layout/colour CSS and
  overrides it. Original theme switcher still works underneath; NeoPussy's rules win.
- `index.html` keeps every DOM id, `onclick` handler and script include (in the same
  order) that the engine expects, so `jailbreak.js`, `payloadsHandler.js`, `events.js`,
  `HENs.js`, `checkFw.js`, `language.js` etc. run untouched.
- Added markup is limited to presentation wrappers (`nx-*` classes). In `index.html`
  the original UI is fully covered by an opaque layer, so only the one-click card is
  seen and clicked; no engine element was deleted or renamed.

## Publish it (GitHub Pages)

Step-by-step guide (in Indonesian): **[DEPLOY.md](DEPLOY.md)**. Short version:

1. Create a **public** repository, upload the folder in 3 batches (root + `includes/`,
   then `src/`) — 234 files / ~15.7 MB, GitHub web upload allows 100 files per commit.
2. Settings → Pages → Deploy from branch → `main` / root.
3. Site appears at `https://<user>.github.io/<repo>/` — the one-click simple homepage,
   which is the only page meant to be visited.

> GitHub Pages is HTTPS-only. The PS4 payload sender talks to
> `http://<ps4-ip>:9020/9021`, which browsers block from an HTTPS page, so Pages is
> fine for the UI but real payload delivery needs a plain-HTTP host (LAN server, VPS,
> Firebase Hosting, or a custom domain with HTTPS redirect disabled).

## Contents

- `src/` — exploit chains (psfree-lapse, badhoist, cssfontface, slopkit, relapse,
  bpf-double-free, wobkot) and their helper modules
- `includes/payloads/` — HEN binaries (GoldHEN 2.4b18.x, PS4HEN, nexHEN), Tools
  (`Bins/`), Legacy, Homebrew, Linux ELFs, fan-threshold payloads
- `includes/caches/` — firmware-routed cache pages for `cache.html`

## Notes & caveats

- Everything is mirrored for personal/offline use. **All original credit belongs to
  ArabPixel and the listed contributors** (see the About dialog); payloads belong to
  their respective authors.
- Jailbreaking/modifying a console can violate PSN terms and warranty. Use at your own risk.
- Using the host over plain HTTP on a shared network exposes it to MITM; prefer a
  trusted, isolated LAN.
- `cache.html` relies on AppCache, which modern desktop browsers dropped; it only
  matters for real PS4 users.
- If the PS4 still shows a low-memory warning during the exploit, restart its browser
  (or the console) first — the kernel chain needs nearly all free RAM. This page now
  avoids holding exploit data in JS memory on purpose.
